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

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    public List<Produto> getAll() {
        // Retorna todos os produtos, útil para a tela de listagem
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
        // Retorna um produto específico pelo seu ID
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
            // Se for um kit, estabelece a relação bidirecional antes de salvar
            if (produto.isKit() && produto.getGruposKit() != null) {
                produto.getGruposKit().forEach(grupo -> {
                    grupo.setProdutoKit(produto);
                    if (grupo.getOpcoes() != null) {
                        grupo.getOpcoes().forEach(opcao -> opcao.setGrupo(grupo));
                    }
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
            produtoExistente.getGruposKit().clear();

            // Se o produto atualizado é um kit, reconstrói a lista de grupos do zero.
            if (produtoDetails.isKit() && produtoDetails.getGruposKit() != null) {
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

    @GetMapping("/cardapio")
    public List<Produto> getProdutosParaCardapio() {
        // Lógica simplificada para retornar apenas produtos que devem aparecer no cardápio
        return repository.findAll().stream()
                .filter(p -> p.isAtivo() && !p.isMateriaPrima())
                .collect(Collectors.toList());
    }
}