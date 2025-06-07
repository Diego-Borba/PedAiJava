package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.EntradaDTO;
import com.PedAi.PedAi.DTO.EntradaItemDTO;
import com.PedAi.PedAi.Model.Entrada;
import com.PedAi.PedAi.Model.EntradaItem;
import com.PedAi.PedAi.Model.Fornecedor;
import com.PedAi.PedAi.Model.Produto;
import com.PedAi.PedAi.repository.EntradaRepository;
import com.PedAi.PedAi.repository.FornecedorRepository;
import com.PedAi.PedAi.repository.ProdutoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/entradas")
public class EntradaController {

    @Autowired
    private EntradaRepository entradaRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<String> registrarEntrada(@RequestBody EntradaDTO entradaDTO) {

        Optional<Fornecedor> fornecedorOpt = fornecedorRepository.findById(entradaDTO.getFornecedorId());
        if (fornecedorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Fornecedor não encontrado.");
        }

        Entrada entrada = new Entrada();
        entrada.setDataEntrada(LocalDate.now());
        entrada.setTipoDocumento(entradaDTO.getTipoDocumento());
        entrada.setFornecedor(fornecedorOpt.get());

        List<EntradaItem> itens = new ArrayList<>();

        for (EntradaItemDTO itemDTO : entradaDTO.getItens()) {

            // ================== MELHORIA 1: Validação do DTO ==================
            if (itemDTO.getProdutoId() == null || itemDTO.getQuantidade() == null
                    || itemDTO.getFatorEntrada() == null) {
                return ResponseEntity.badRequest()
                        .body("Para cada item, é obrigatório informar produtoId, quantidade e fatorEntrada.");
            }
            // =================================================================

            Optional<Produto> produtoOpt = produtoRepository.findById(itemDTO.getProdutoId());
            if (produtoOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Produto com ID " + itemDTO.getProdutoId() + " não encontrado.");
            }

            Produto produto = produtoOpt.get();

            BigDecimal quantidadeParaEstoque = itemDTO.getQuantidade().multiply(itemDTO.getFatorEntrada());

            // ================== CORREÇÃO PRINCIPAL: Checagem de Nulo ==================
            // Pega o estoque atual. Se for nulo (produto antigo), considera como ZERO.
            BigDecimal estoqueAtualDoProduto = produto.getEstoqueAtual() == null ? BigDecimal.ZERO
                    : produto.getEstoqueAtual();

            // Soma a nova quantidade ao estoque (agora seguro)
            BigDecimal novoEstoque = estoqueAtualDoProduto.add(quantidadeParaEstoque);
            produto.setEstoqueAtual(novoEstoque);
            // ======================================================================

            // Não precisamos mais salvar aqui, o @Transactional cuidará disso no final.
            // produtoRepository.save(produto);

            EntradaItem item = new EntradaItem();
            item.setEntrada(entrada);
            item.setProduto(produto);
            item.setQuantidade(itemDTO.getQuantidade());
            item.setPrecoUnitario(itemDTO.getPrecoUnitario());
            item.setFatorEntrada(itemDTO.getFatorEntrada());

            itens.add(item);
        }

        entrada.setItens(itens);
        entradaRepository.save(entrada); // O @Transactional garante que os produtos atualizados também serão salvos.

        return ResponseEntity.status(HttpStatus.CREATED).body("Entrada registrada e estoque atualizado com sucesso.");
    }

}
