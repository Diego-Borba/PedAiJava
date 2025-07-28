package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;


import com.PedAi.PedAi.DTO.ProdutoListDTO;
import com.PedAi.PedAi.DTO.GrupoCardapioDTO;
import com.PedAi.PedAi.DTO.ProdutoCardapioDTO;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    @Transactional(readOnly = true)
    public List<ProdutoListDTO> getAll() {
        List<Produto> produtos = repository.findAll();

        // Converte a lista de entidades 'Produto' para uma lista de 'ProdutoListDTO'
        return produtos.stream()
                .map(ProdutoListDTO::new) // Para cada produto, cria um DTO
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true) // Adiciona a transação de apenas leitura
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
        // Busca o produto no repositório
        Optional<Produto> produtoOpt = repository.findById(id);

        // Se não encontrar, retorna 404 Not Found
        if (produtoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Produto produto = produtoOpt.get();

        // Se o produto for um Kit, força a inicialização das coleções "preguiçosas"
        // para que elas sejam incluídas na resposta JSON para a tela de edição.
        if (produto.isKit()) {
            produto.getGruposKit().forEach(grupo -> {
                grupo.getOpcoes().size(); // Esta chamada inicializa a lista de opções de cada grupo
            });
        }

        // Retorna o produto com os dados completos
        return ResponseEntity.ok(produto);
    }


    @PostMapping
    @Transactional
    public ResponseEntity<Produto> create(@RequestBody Produto produto) {
        try {
            // MUDANÇA: Estabelece a relação de mão dupla antes de salvar
            if (produto.isKit() && produto.getGruposKit() != null) {
                produto.getGruposKit().forEach(grupo -> {
                    grupo.setProdutoKit(produto); // Linka o grupo de volta para o produto
                    grupo.getOpcoes().forEach(opcao -> {
                        opcao.setGrupo(grupo); // Linka a opção de volta para o grupo
                        // Garante que o produto da opção seja uma entidade gerenciada
                        if (opcao.getProduto() != null && opcao.getProduto().getId() != null) {
                            repository.findById(opcao.getProduto().getId()).ifPresent(opcao::setProduto);
                        }
                    });
                });
            }
            Produto savedProduto = repository.save(produto);
            return ResponseEntity.status(201).body(savedProduto);
        } catch (Exception e) {
            System.err.println("Erro ao criar produto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Produto> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        return repository.findById(id).map(produtoExistente -> {

            // --- Mapeamento explícito de todos os campos ---
            produtoExistente.setNome(produtoDetails.getNome());
            produtoExistente.setPreco(produtoDetails.getPreco());
            produtoExistente.setCategoria(produtoDetails.getCategoria());
            produtoExistente.setQtdeMax(produtoDetails.getQtdeMax());
            produtoExistente.setCodPdv(produtoDetails.getCodPdv());
            produtoExistente.setDescricao(produtoDetails.getDescricao());
            produtoExistente.setOrdemVisualizacao(produtoDetails.getOrdemVisualizacao());
            produtoExistente.setImagem(produtoDetails.getImagem());

            // Booleans
            produtoExistente.setMateriaPrima(produtoDetails.isMateriaPrima());
            produtoExistente.setIsComplemento(produtoDetails.isComplemento());
            produtoExistente.setPermiteComplementos(produtoDetails.isPermiteComplementos());
            produtoExistente.setKit(produtoDetails.isKit());

            // Lógica para atualizar a lista de grupos do Kit
            produtoExistente.getGruposKit().clear(); // Limpa a lista antiga para evitar órfãos
            if (produtoDetails.isKit() && produtoDetails.getGruposKit() != null) {
                produtoDetails.getGruposKit().forEach(grupoNovo -> {
                    grupoNovo.setProdutoKit(produtoExistente); // Link de volta para o produto
                    grupoNovo.getOpcoes().forEach(opcaoNova -> {
                        opcaoNova.setGrupo(grupoNovo); // Link de volta para o grupo
                        // Garante que o produto da opção seja uma entidade gerenciada pelo JPA
                        if (opcaoNova.getProduto() != null && opcaoNova.getProduto().getId() != null) {
                            repository.findById(opcaoNova.getProduto().getId()).ifPresent(opcaoNova::setProduto);
                        }
                    });
                    produtoExistente.getGruposKit().add(grupoNovo);
                });
            }

            // OBS: A lógica para atualizar 'receita' e 'complementosDisponiveis' pode ser
            // adicionada aqui se necessário

            Produto updatedProduto = repository.save(produtoExistente);
            return ResponseEntity.ok(updatedProduto);

        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id))
            return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> getCategorias() {
        List<String> categorias = repository.findDistinctCategorias();
        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/cardapio")
    @Transactional(readOnly = true)
    public List<Produto> getProdutosParaCardapio() {
        // Regra final: A API envia TODOS os produtos ativos.
        // Isto garante que o frontend sempre tenha a lista completa de opções
        // para a montagem de kits. O frontend será responsável por filtrar o que mostrar.
        return repository.findAll().stream()
                .filter(Produto::isAtivo)
                .collect(Collectors.toList());
    }

}