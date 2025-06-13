package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.ItemPedidoDTO;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;
import com.PedAi.PedAi.services.PedidoService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/webhook")
public class WebhookController {

    @Autowired
    private ProdutoRepository produtoRepository;
    @Autowired
    private PedidoService pedidoService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);

    @PostMapping
    public ResponseEntity<String> handleWebhook(@RequestBody String requestBody) {
        try {
            JsonNode requestJson = objectMapper.readTree(requestBody);
            logger.info("==================== NOVO WEBHOOK RECEBIDO ====================");

            String intentName = requestJson.path("queryResult").path("intent").path("displayName").asText();
            String session = requestJson.path("session").asText();
            logger.info("Sessão: [{}], Intenção: [{}]", session, intentName);

            ObjectNode responseJson;

            switch (intentName) {
                case "ver_cardapio":
                    logger.info("Processando intenção 'ver_cardapio'...");
                    responseJson = createDialogflowResponse(handleVerCardapio());
                    break;
                case "escolher_categoria":
                    logger.info("Processando intenção 'escolher_categoria'...");
                    responseJson = createDialogflowResponse(handleEscolherCategoria(requestJson));
                    break;
                case "adicionar_produto":
                    logger.info("Processando intenção 'adicionar_produto'...");
                    responseJson = handleAdicionarProduto(requestJson, session);
                    break;
                case "confirmar_pedido":
                    logger.info("Processando intenção 'confirmar_pedido'...");
                    responseJson = handleConfirmarPedido(requestJson, session);
                    break;
                case "iniciar_checkout":
                    logger.info("Processando intenção 'iniciar_checkout'...");
                    String textoResposta = "Ótimo! O pedido é para entrega ou para retirada no local?";
                    responseJson = createDialogflowResponse(textoResposta);
                    break;
                case "escolher_tipo_entrega":
                    logger.info("Processando intenção 'escolher_tipo_entrega'...");
                    responseJson = handleEscolherTipoEntrega(requestJson, session);
                    break;
                case "confirmar_finalizacao_pedido":
                    logger.info("Processando intenção 'finalizar_pedido_api'...");
                    responseJson = handleFinalizarPedido(requestJson, session);
                    break;
                default:
                    logger.warn("Intenção não mapeada: {}", intentName);
                    responseJson = createDialogflowResponse("Desculpe, não entendi. Pode repetir?");
                    break;
            }
            // CORREÇÃO: Movido o log para fora do bloco try-catch para evitar log duplo em
            // caso de erro
            if (!intentName.equals("Default Fallback Intent")) {
                logger.info("Webhook Respondendo com sucesso para a intenção: [{}].", intentName);
            }
            return ResponseEntity.ok(responseJson.toString());

        } catch (Exception e) {
            logger.error("### ERRO FATAL NO WEBHOOK ###", e);
            // Cria uma resposta de erro amigável para o usuário no Dialogflow
            ObjectNode errorResponse = createDialogflowResponse(
                    "Desculpe, encontrei um problema técnico. Poderia tentar novamente?");
            return ResponseEntity.ok(errorResponse.toString());
        }
    }

    private ObjectNode handleEscolherTipoEntrega(JsonNode requestJson, String session) {
        String tipoEntrega = requestJson.path("queryResult").path("parameters").path("tipo_entrega").asText();
        String responseText;

        if ("entrega".equalsIgnoreCase(tipoEntrega)) {
            responseText = "Entendido, pedido para entrega. Por favor, informe seu endereço completo (Rua, Número e Bairro).";
            return createResponseWithContext(responseText, session, "checkout_iniciado", 5, Map.of());
        } else if ("retirada".equalsIgnoreCase(tipoEntrega)) {
            responseText = "Ok, pedido para retirada. Vou finalizar seu pedido!";
            return createResponseWithContext(responseText, session, "checkout_iniciado", 5, Map.of());
        } else {
            responseText = "Não entendi se é para entrega ou retirada. Pode repetir, por favor?";
            return createDialogflowResponse(responseText);
        }
    }

    private String handleVerCardapio() {
        List<String> categorias = produtoRepository.findDistinctCategorias();
        if (categorias.isEmpty())
            return "Nosso cardápio parece estar vazio no momento.";
        return "Temos as seguintes categorias:\n- " + String.join("\n- ", categorias)
                + "\nQual delas você gostaria de ver?";
    }

    private String handleEscolherCategoria(JsonNode requestJson) {
        String categoria = requestJson.path("queryResult").path("parameters").path("categoria").asText();
        if (categoria.isEmpty())
            return "Qual categoria você gostaria de ver?";

        List<Produto> produtos = produtoRepository.findProdutosDeCardapioPorCategoria(categoria);
        if (produtos.isEmpty())
            return "Não encontrei produtos na categoria '" + categoria + "'.";

        String produtosTexto = produtos.stream()
                .map(p -> String.format("%s - R$ %.2f", p.getNome(), p.getPreco()))
                .collect(Collectors.joining("\n"));
        return "Na categoria " + categoria + " temos:\n" + produtosTexto + "\n\nQual produto você deseja?";
    }

    private ObjectNode handleAdicionarProduto(JsonNode requestJson, String session) {
        // CORREÇÃO: Define a variável 'parameters' que estava faltando
        JsonNode parameters = requestJson.path("queryResult").path("parameters");

        // CORREÇÃO: Lógica mais robusta para extrair o nome do produto
        JsonNode produtoNode = parameters.path("produto");
        String nomeProduto = "";
        if (produtoNode.isArray() && !produtoNode.isEmpty()) {
            nomeProduto = produtoNode.get(0).asText();
        } else {
            nomeProduto = produtoNode.asText();
        }

        int quantidade = parameters.path("number").asInt(1);

        List<Map<String, Object>> carrinho = getCarrinhoFromContext(requestJson);
        carrinho.add(Map.of("produto", nomeProduto, "quantidade", quantidade));

        String responseText = String.format("Ok, adicionei %d %s. Deseja algo mais?", quantidade, nomeProduto);
        if (isLanche(nomeProduto)) {
            responseText += " Pessoas que compram lanches também costumam levar uma bebida. Quer ver as opções?";
        }

        return createResponseWithContext(responseText, session, "pedido_em_andamento", 15,
                Map.of("carrinho", carrinho));
    }

    private ObjectNode handleConfirmarPedido(JsonNode requestJson, String session) {
        List<Map<String, Object>> carrinho = getCarrinhoFromContext(requestJson);
        if (carrinho.isEmpty()) {
            return createDialogflowResponse("Seu carrinho está vazio. Gostaria de ver o cardápio?");
        }

        BigDecimal total = BigDecimal.ZERO;
        StringBuilder resumo = new StringBuilder("Confirmando seu pedido:\n");

        for (Map<String, Object> item : carrinho) {
            String nomeProduto = (String) item.get("produto");

            // CORREÇÃO: Converte o número de Double para Integer de forma segura
            int quantidade = ((Number) item.get("quantidade")).intValue();

            Optional<Produto> prodOpt = produtoRepository.findAll().stream()
                    .filter(p -> p.getNome().equalsIgnoreCase(nomeProduto)).findFirst();

            if (prodOpt.isPresent()) {
                BigDecimal preco = BigDecimal.valueOf(prodOpt.get().getPreco());
                total = total.add(preco.multiply(BigDecimal.valueOf(quantidade)));
                resumo.append(String.format("- %dx %s\n", quantidade, nomeProduto));
            } else {
                // Adicionado para o caso de o produto do carrinho não ser encontrado no BD
                resumo.append(String.format("- %dx %s (Produto não encontrado)\n", quantidade, nomeProduto));
            }
        }
        resumo.append(String.format("\nTotal: R$ %.2f. Confirma?", total));

        return createResponseWithContext(resumo.toString(), session, "checkout_iniciado", 5,
                Map.of("carrinho", carrinho, "total", total));
    }

    private ObjectNode handleFinalizarPedido(JsonNode requestJson, String session) {
        List<Map<String, Object>> carrinho = getCarrinhoFromContext(requestJson);

        List<ItemPedidoDTO> itensDTO = new ArrayList<>();
        for (Map<String, Object> item : carrinho) {
            String nomeProduto = (String) item.get("produto");
            // CORREÇÃO: Converte o número de Double para Integer de forma segura
            int quantidade = ((Number) item.get("quantidade")).intValue();

            Optional<Produto> prodOpt = produtoRepository.findAll().stream()
                    .filter(p -> p.getNome().equalsIgnoreCase(nomeProduto)).findFirst();

            if (prodOpt.isPresent()) {
                Produto p = prodOpt.get();
                ItemPedidoDTO dto = new ItemPedidoDTO();
                dto.setProdutoId(p.getId());
                dto.setQuantidade(quantidade);
                dto.setPrecoUnitario(BigDecimal.valueOf(p.getPreco()));
                itensDTO.add(dto);
            }
        }

        try {
            pedidoService.criarPedido(itensDTO);
            String responseText = "Seu pedido foi recebido e já está em preparo! Muito obrigado!";
            // CORREÇÃO: Limpa os dois contextos ao finalizar
            return createResponseWithContext(responseText, session, "_DELETED_CONTEXT_", 0, Map.of());
        } catch (Exception e) {
            logger.error("Erro ao tentar criar pedido via webhook", e);
            return createDialogflowResponse(
                    "Tivemos um problema ao registrar seu pedido: " + e.getMessage() + ". Tente novamente.");
        }
    }

    private boolean isLanche(String nomeProduto) {
        if (nomeProduto == null || nomeProduto.isEmpty())
            return false;
        String nomeLower = nomeProduto.toLowerCase();
        return nomeLower.contains("hamburguer") || nomeLower.contains("x-") || nomeLower.contains("cachorro");
    }

    private List<Map<String, Object>> getCarrinhoFromContext(JsonNode requestJson) {
        JsonNode outputContexts = requestJson.path("queryResult").path("outputContexts");
        for (JsonNode context : outputContexts) {
            if (context.path("name").asText().endsWith("/contexts/pedido_em_andamento")) {
                JsonNode carrinhoNode = context.path("parameters").path("carrinho");
                if (carrinhoNode != null && !carrinhoNode.isMissingNode() && carrinhoNode.isArray()) {
                    // CORREÇÃO: Retorna uma lista de mapas mutável para que possamos adicionar
                    // itens
                    return objectMapper.convertValue(carrinhoNode, new TypeReference<ArrayList<Map<String, Object>>>() {
                    });
                }
            }
        }
        return new ArrayList<>();
    }

    private ObjectNode createResponseWithContext(String text, String session, String contextName, int lifespan,
            Map<String, ?> parameters) {
        ObjectNode response = createDialogflowResponse(text);

        // CORREÇÃO: Lógica para deletar todos os contextos de pedido ao finalizar
        if ("_DELETED_CONTEXT_".equals(contextName)) {
            ArrayNode outputContexts = response.putArray("outputContexts");

            ObjectNode contextNodePedido = objectMapper.createObjectNode();
            contextNodePedido.put("name", session + "/contexts/pedido_em_andamento");
            contextNodePedido.put("lifespanCount", 0);
            outputContexts.add(contextNodePedido);

            ObjectNode contextNodeCheckout = objectMapper.createObjectNode();
            contextNodeCheckout.put("name", session + "/contexts/checkout_iniciado");
            contextNodeCheckout.put("lifespanCount", 0);
            outputContexts.add(contextNodeCheckout);
        } else {
            ObjectNode contextNode = objectMapper.createObjectNode();
            contextNode.put("name", session + "/contexts/" + contextName);
            contextNode.put("lifespanCount", lifespan);
            contextNode.set("parameters", objectMapper.valueToTree(parameters));
            response.putArray("outputContexts").add(contextNode);
        }
        return response;
    }

    private ObjectNode createDialogflowResponse(String text) {
        ObjectNode response = objectMapper.createObjectNode();
        ArrayNode fulfillmentMessages = response.putArray("fulfillmentMessages");
        ObjectNode messageContainer = fulfillmentMessages.addObject();
        ObjectNode textNode = messageContainer.putObject("text");
        textNode.putArray("text").add(text);
        return response;
    }
}