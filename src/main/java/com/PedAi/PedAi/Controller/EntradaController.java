package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.EntradaDTO;
import com.PedAi.PedAi.DTO.EntradaItemDTO;
import com.PedAi.PedAi.DTO.ParcelaPagamentoDTO;
import com.PedAi.PedAi.Model.*;
import com.PedAi.PedAi.repository.ContaAPagarRepository;
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

    @Autowired private EntradaRepository entradaRepository;
    @Autowired private ProdutoRepository produtoRepository;
    @Autowired private FornecedorRepository fornecedorRepository;
    @Autowired private ContaAPagarRepository contaAPagarRepository; // INJETADO

    @PostMapping
    @Transactional
    public ResponseEntity<String> registrarEntrada(@RequestBody EntradaDTO entradaDTO) {

        Fornecedor fornecedor = fornecedorRepository.findById(entradaDTO.getFornecedorId())
                .orElseThrow(() -> new IllegalArgumentException("Fornecedor não encontrado."));

        Entrada entrada = new Entrada();
        entrada.setDataEntrada(LocalDate.now());
        entrada.setTipoDocumento(entradaDTO.getTipoDocumento());
        entrada.setFornecedor(fornecedor);
        entrada.setValorTotalDocumento(entradaDTO.getValorTotalDocumento());
        entrada.setFormaPagamento(entradaDTO.getFormaPagamento());
        
        Entrada entradaSalva = entradaRepository.save(entrada);
        Long entradaId = entradaSalva.getId();

        List<EntradaItem> itens = new ArrayList<>();
        for (EntradaItemDTO itemDTO : entradaDTO.getItens()) {
            Produto produto = produtoRepository.findById(itemDTO.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto com ID " + itemDTO.getProdutoId() + " não encontrado."));

            BigDecimal quantidadeParaEstoque = itemDTO.getQuantidade().multiply(itemDTO.getFatorEntrada());
            BigDecimal estoqueAtual = produto.getEstoqueAtual() == null ? BigDecimal.ZERO : produto.getEstoqueAtual();
            produto.setEstoqueAtual(estoqueAtual.add(quantidadeParaEstoque));
            
            
            EntradaItem item = new EntradaItem();
            item.setEntrada(entradaSalva);
            item.setProduto(produto);
            item.setQuantidade(itemDTO.getQuantidade());
            item.setPrecoUnitario(itemDTO.getPrecoUnitario());
            item.setFatorEntrada(itemDTO.getFatorEntrada());
            itens.add(item);
        }
        entradaSalva.setItens(itens);

    
        if (entradaDTO.getParcelas() != null && !entradaDTO.getParcelas().isEmpty()) {
            int numeroParcela = 1;
            for (ParcelaPagamentoDTO parcelaDTO : entradaDTO.getParcelas()) {
                ContaAPagar conta = new ContaAPagar();
                conta.setFornecedor(fornecedor);
                conta.setValorTotal(parcelaDTO.getValor());
                conta.setDataVencimento(parcelaDTO.getDataVencimento());
                conta.setStatus(StatusContaAPagar.A_PAGAR);
                
                // Formata a descrição com o número da parcela: Ex: "NF-e 12345 (1/3)"
                String descParcela = String.format("%05d/%d", entradaId, numeroParcela);
                conta.setDescricao(entradaDTO.getTipoDocumento() + " - Parcela " + descParcela);

                contaAPagarRepository.save(conta);
                numeroParcela++;
            }
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body("Entrada " + entradaId + " registrada e estoque atualizado com sucesso.");
    }
}