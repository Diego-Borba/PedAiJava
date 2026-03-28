package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.*;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository repository;

    @Transactional(readOnly = true)
    public List<ProdutoListDTO> getAll() {
        return repository.findAllForAdminList().stream()
                .map(ProdutoListDTO::new)
                .collect(Collectors.toList());
    }

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

    @Transactional(readOnly = true)
    public Optional<Produto> getById(Long id) {
        return repository.findById(id).map(produto -> {
            if (produto.isKit()) {
                produto.getGruposKit().forEach(grupo -> grupo.getOpcoes().size());
            }
            return produto;
        });
    }

    @Transactional
    public Produto create(Produto produto) {
        if (produto.getNome() == null || produto.getNome().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome do produto é obrigatório.");
        }
        
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
        
        return repository.save(produto);
    }

    @Transactional
    public void uploadImagem(Long id, ImagemDTO imagemDTO) {
        if (imagemDTO.getImagemBase64() == null || imagemDTO.getImagemTipo() == null) {
            throw new IllegalArgumentException("Dados da imagem inválidos.");
        }

        Produto produto = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado."));

        try {
            String base64Data = imagemDTO.getImagemBase64().substring(imagemDTO.getImagemBase64().indexOf(",") + 1);
            byte[] imagemBytes = Base64.getDecoder().decode(base64Data);

            produto.setImagemDados(imagemBytes);
            produto.setImagemTipo(imagemDTO.getImagemTipo());
            repository.save(produto);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Formato de imagem Base64 inválido.");
        }
    }

    @Transactional
    public Produto update(Long id, Produto produtoDetails) {
        Produto produtoExistente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado."));

        produtoExistente.setNome(produtoDetails.getNome());
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
                grupoNovo.getOpcoes().forEach(opcaoNova -> {
                    opcaoNova.setGrupo(grupoNovo);
                    if (opcaoNova.getProduto() != null && opcaoNova.getProduto().getId() != null) {
                        repository.findById(opcaoNova.getProduto().getId()).ifPresent(opcaoNova::setProduto);
                    }
                });
                produtoExistente.getGruposKit().add(grupoNovo);
            });
        }
        
        produtoExistente.getReceita().clear();
        if (produtoDetails.getReceita() != null && !produtoDetails.getReceita().isEmpty()) {
            produtoExistente.getReceita().addAll(produtoDetails.getReceita());
        }

        return repository.save(produtoExistente);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Produto não encontrado.");
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<String> getCategorias() {
        return repository.findDistinctCategorias();
    }

    @Transactional(readOnly = true)
    public List<ProdutoSearchDTO> searchProdutos(String termo) {
        if (termo == null || termo.trim().isEmpty()) {
            return List.of();
        }
        
        // Aplicação dos curingas % para permitir a busca parcial
        String termoBusca = "%" + termo.trim().toLowerCase() + "%";
        
        return repository.searchByNomeOrCodigoPdv(termoBusca).stream()
                .map(ProdutoSearchDTO::new)
                .collect(Collectors.toList());
    }
}