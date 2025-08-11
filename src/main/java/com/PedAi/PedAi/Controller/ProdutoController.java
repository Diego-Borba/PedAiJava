package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.GrupoComplemento;
import com.PedAi.PedAi.Model.OpcaoComplemento;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.PedAi.PedAi.DTO.ProdutoListDTO;
import java.util.stream.Collectors;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
<<<<<<< HEAD
    @Transactional(readOnly = true)
    public List<ProdutoListDTO> getAll() {
        List<Produto> produtos = repository.findAll();
        return produtos.stream()
                .map(ProdutoListDTO::new)
                .collect(Collectors.toList());
=======
    public List<Produto> getAll() {
        // Retorna todos os produtos, útil para a tela de listagem
        return repository.findAll();
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
<<<<<<< HEAD
        Optional<Produto> produtoOpt = repository.findById(id);
        if (produtoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Produto produto = produtoOpt.get();
        if (produto.isKit()) {
            produto.getGruposKit().forEach(grupo -> grupo.getOpcoes().size());
        }
        return ResponseEntity.ok(produto);
=======
        // Retorna um produto específico pelo seu ID
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Produto produto) {
        // Valida se os campos essenciais foram preenchidos
        if (produto.getNome() == null || produto.getNome().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("O nome do produto é obrigatório.");
        }
        if (produto.getPreco() == null || produto.getPreco() < 0) {
            return ResponseEntity.badRequest().body("O preço do produto é obrigatório e não pode ser negativo.");
        }

        try {
<<<<<<< HEAD
            if (produto.isKit() && produto.getGruposKit() != null) {
                produto.getGruposKit().forEach(grupo -> {
                    grupo.setProdutoKit(produto);
                    grupo.getOpcoes().forEach(opcao -> {
                        opcao.setGrupo(grupo);
                        if (opcao.getProduto() != null && opcao.getProduto().getId() != null) {
                            repository.findById(opcao.getProduto().getId()).ifPresent(opcao::setProduto);
                        }
                    });
=======
            // Se for um kit, estabelece a relação bidirecional antes de salvar
            if (produto.isKit() && produto.getGruposKit() != null) {
                produto.getGruposKit().forEach(grupo -> {
                    grupo.setProdutoKit(produto);
                    if (grupo.getOpcoes() != null) {
                        grupo.getOpcoes().forEach(opcao -> opcao.setGrupo(grupo));
                    }
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
                });
            }
            Produto savedProduto = repository.save(produto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao salvar produto: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        return repository.findById(id).map(produtoExistente -> {
<<<<<<< HEAD
            produtoExistente.setNome(produtoDetails.getNome());
            produtoExistente.setPreco(produtoDetails.getPreco());
            produtoExistente.setCategoria(produtoDetails.getCategoria());
            produtoExistente.setQtdeMax(produtoDetails.getQtdeMax());
            produtoExistente.setCodPdv(produtoDetails.getCodPdv());
            produtoExistente.setDescricao(produtoDetails.getDescricao());
            produtoExistente.setOrdemVisualizacao(produtoDetails.getOrdemVisualizacao());
            produtoExistente.setImagem(produtoDetails.getImagem());
            produtoExistente.setMateriaPrima(produtoDetails.isMateriaPrima());
            produtoExistente.setIsComplemento(produtoDetails.isComplemento());
            produtoExistente.setPermiteComplementos(produtoDetails.isPermiteComplementos());
            produtoExistente.setKit(produtoDetails.isKit());
            produtoExistente.setVendidoIndividualmente(produtoDetails.isVendidoIndividualmente());

=======
            
            // 1. ATUALIZA OS CAMPOS SIMPLES DO PRODUTO EXISTENTE
            produtoExistente.setNome(produtoDetails.getNome());
            produtoExistente.setPreco(produtoDetails.getPreco());
            produtoExistente.setCategoria(produtoDetails.getCategoria());
            produtoExistente.setDescricao(produtoDetails.getDescricao());
            produtoExistente.setImagem(produtoDetails.getImagem());
            produtoExistente.setAtivo(produtoDetails.isAtivo());
            produtoExistente.setQtdeMax(produtoDetails.getQtdeMax());
            produtoExistente.setCodPdv(produtoDetails.getCodPdv());
            produtoExistente.setOrdemVisualizacao(produtoDetails.getOrdemVisualizacao());
            produtoExistente.setMateriaPrima(produtoDetails.isMateriaPrima());
            produtoExistente.setKit(produtoDetails.isKit());
            produtoExistente.setIsComplemento(produtoDetails.isComplemento());
            produtoExistente.setPermiteComplementos(produtoDetails.isPermiteComplementos());

            // 2. APLICA A ESTRATÉGIA "LIMPAR E RECONSTRUIR" PARA A LISTA DE GRUPOS
            // Remove todos os grupos antigos. O 'orphanRemoval=true' na entidade Produto
            // garante que os registros filhos sejam deletados do banco.
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
            produtoExistente.getGruposKit().clear();

            // Se o produto atualizado é um kit, reconstrói a lista de grupos do zero.
            if (produtoDetails.isKit() && produtoDetails.getGruposKit() != null) {
<<<<<<< HEAD
                produtoDetails.getGruposKit().forEach(grupoNovo -> {
                    grupoNovo.setProdutoKit(produtoExistente);
                    grupoNovo.getOpcoes().forEach(opcaoNova -> {
                        opcaoNova.setGrupo(grupoNovo);
                        if (opcaoNova.getProduto() != null && opcaoNova.getProduto().getId() != null) {
                            repository.findById(opcaoNova.getProduto().getId()).ifPresent(opcaoNova::setProduto);
                        }
                    });
                    produtoExistente.getGruposKit().add(grupoNovo);
                });
            }

            Produto updatedProduto = repository.save(produtoExistente);
            return ResponseEntity.ok(updatedProduto);
=======
                produtoDetails.getGruposKit().forEach(grupoDto -> {
                    GrupoComplemento novoGrupo = new GrupoComplemento();
                    novoGrupo.setNome(grupoDto.getNome());
                    novoGrupo.setTipoSelecao(grupoDto.getTipoSelecao());
                    novoGrupo.setQuantidadeMaxima(grupoDto.getQuantidadeMaxima());
                    novoGrupo.setProdutoKit(produtoExistente); // Link para o produto "pai"

                    if (grupoDto.getOpcoes() != null) {
                        grupoDto.getOpcoes().forEach(opcaoDto -> {
                            // Encontra o produto que será a opção para garantir que ele é uma entidade gerenciada
                            repository.findById(opcaoDto.getProduto().getId()).ifPresent(produtoDaOpcao -> {
                                OpcaoComplemento novaOpcao = new OpcaoComplemento();
                                novaOpcao.setProduto(produtoDaOpcao);
                                novaOpcao.setGrupo(novoGrupo); // Link para o grupo "pai"
                                novoGrupo.getOpcoes().add(novaOpcao);
                            });
                        });
                    }
                    // Adiciona o grupo totalmente reconstruído à lista do produto
                    produtoExistente.getGruposKit().add(novoGrupo);
                });
            }

            // 3. SALVA O PRODUTO
            // O JPA/Hibernate irá executar as operações de DELETE dos grupos antigos
            // e depois as operações de INSERT dos grupos novos, tudo em uma única transação.
            repository.save(produtoExistente);
            return ResponseEntity.ok(produtoExistente);
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8

        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> getCategorias() {
        List<String> categorias = repository.findDistinctCategorias();
        return ResponseEntity.ok(categorias);
    }

    /**
     * MÉTODO-CHAVE DA SOLUÇÃO:
     * Este método é responsável por enviar a lista de produtos para a tela do cardápio.
     * A lógica aqui garante que TODOS os produtos ativos que NÃO SÃO matéria-prima sejam enviados.
     * Isso corrige o erro "Produto... não encontrado", pois a lista no frontend estará completa.
     */
    @GetMapping("/cardapio")
    @Transactional(readOnly = true)
    public List<Produto> getProdutosParaCardapio() {
<<<<<<< HEAD
        return repository.findAll().stream()
                .filter(Produto::isAtivo)
                .filter(p -> !p.isMateriaPrima())
=======
        // Lógica simplificada para retornar apenas produtos que devem aparecer no cardápio
        return repository.findAll().stream()
                .filter(p -> p.isAtivo() && !p.isMateriaPrima())
>>>>>>> 619b7936e6020c55eea491fe08d7e589cba44ea8
                .collect(Collectors.toList());
    }
}