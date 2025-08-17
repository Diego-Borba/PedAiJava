// src/main/java/com/PedAi/PedAi/Controller/ProdutoController.java
package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.DTO.ImagemDTO;
import com.PedAi.PedAi.DTO.ProdutoListDTO;
import com.PedAi.PedAi.DTO.ProdutoCardapioDTO;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    // ... (Os métodos GET permanecem os mesmos que já corrigimos)
    @GetMapping
    @Transactional(readOnly = true)
    public List<ProdutoListDTO> getAll() {
        return repository.findAllForAdminList().stream()
                .map(ProdutoListDTO::new)
                .collect(Collectors.toList());
    }
    
    @GetMapping("/cardapio")
    @Transactional(readOnly = true)
    public List<ProdutoCardapioDTO> getProdutosParaCardapio() {
        List<Produto> produtos = repository.findProdutosForCardapio();
        for (Produto p : produtos) {
            if (p.isKit()) {
                p.getGruposKit().forEach(grupo -> grupo.getOpcoes().size()); 
            }
        }
        return produtos.stream()
                .map(ProdutoCardapioDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Produto> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(produto -> {
                    if (produto.isKit()) {
                        produto.getGruposKit().forEach(grupo -> grupo.getOpcoes().size());
                    }
                    return ResponseEntity.ok(produto);
                })
                .orElse(ResponseEntity.notFound().build());
    }


    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Produto produto) {
        // A imagem não é mais tratada aqui, apenas os dados do produto
        if (produto.getNome() == null || produto.getNome().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("O nome do produto é obrigatório.");
        }
        try {
            if (produto.isKit() && produto.getGruposKit() != null) {
                produto.getGruposKit().forEach(grupo -> {
                    grupo.setProdutoKit(produto);
                    grupo.getOpcoes().forEach(opcao -> {
                        opcao.setGrupo(grupo);
                        if (opcao.getProduto() != null && opcao.getProduto().getId() != null) {
                            repository.findById(opcao.getProduto().getId()).ifPresent(opcao::setProduto);
                        }
                    });
                });
            }
            Produto savedProduto = repository.save(produto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao salvar produto: " + e.getMessage());
        }
    }

    // --- NOVO ENDPOINT PARA UPLOAD DE IMAGEM ---
    @PostMapping("/{id}/imagem")
    @Transactional
    public ResponseEntity<?> uploadImagem(@PathVariable Long id, @RequestBody ImagemDTO imagemDTO) {
        if (imagemDTO.getImagemBase64() == null || imagemDTO.getImagemTipo() == null) {
            return ResponseEntity.badRequest().body("Dados da imagem inválidos.");
        }

        return repository.findById(id).map(produto -> {
            try {
                // Remove o prefixo "data:image/jpeg;base64," se ele existir
                String base64Data = imagemDTO.getImagemBase64().substring(imagemDTO.getImagemBase64().indexOf(",") + 1);
                byte[] imagemBytes = Base64.getDecoder().decode(base64Data);
                
                produto.setImagemDados(imagemBytes);
                produto.setImagemTipo(imagemDTO.getImagemTipo());
                repository.save(produto);
                return ResponseEntity.ok().body(java.util.Map.of("message", "Imagem salva com sucesso."));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Formato de imagem Base64 inválido.");
            }
        }).orElse(ResponseEntity.notFound().build());
    }


    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Produto produtoDetails) {
        // A imagem não é mais tratada aqui
        return repository.findById(id).map(produtoExistente -> {
            produtoExistente.setNome(produtoDetails.getNome());
            // ... (copiar todos os outros campos como estava antes, exceto a imagem)
            produtoExistente.setPreco(produtoDetails.getPreco());
            produtoExistente.setCategoria(produtoDetails.getCategoria());
            produtoExistente.setQtdeMax(produtoDetails.getQtdeMax());
            produtoExistente.setCodPdv(produtoDetails.getCodPdv());
            produtoExistente.setDescricao(produtoDetails.getDescricao());
            produtoExistente.setOrdemVisualizacao(produtoDetails.getOrdemVisualizacao());
            produtoExistente.setMateriaPrima(produtoDetails.isMateriaPrima());
            produtoExistente.setIsComplemento(produtoDetails.isComplemento());
            produtoExistente.setPermiteComplementos(produtoDetails.isPermiteComplementos());
            produtoExistente.setKit(produtoDetails.isKit());
            produtoExistente.setVendidoIndividualmente(produtoDetails.isVendidoIndividualmente());

            produtoExistente.getGruposKit().clear();
            if (produtoDetails.isKit() && produtoDetails.getGruposKit() != null) {
                produtoDetails.getGruposKit().forEach(grupoNovo -> {
                    grupoNovo.setProdutoKit(produtoExistente);
                    // ... (lógica dos grupos e opções como estava antes)
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
        return ResponseEntity.ok(repository.findDistinctCategorias());
    }
}