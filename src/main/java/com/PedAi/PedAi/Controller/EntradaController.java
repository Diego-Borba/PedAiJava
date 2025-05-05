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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

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
    public ResponseEntity<String> registrarEntrada(@RequestBody EntradaDTO entradaDTO) {

        // Valida fornecedor
        Optional<Fornecedor> fornecedorOpt = fornecedorRepository.findById(entradaDTO.getFornecedorId());
        if (fornecedorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Fornecedor não encontrado.");
        }

        // Cria nova entrada
        Entrada entrada = new Entrada();
        entrada.setDataEntrada(LocalDate.now());
        entrada.setTipoDocumento(entradaDTO.getTipoDocumento());
        entrada.setFornecedor(fornecedorOpt.get());

        List<EntradaItem> itens = new ArrayList<>();

        for (EntradaItemDTO itemDTO : entradaDTO.getItens()) {
            Optional<Produto> produtoOpt = produtoRepository.findById(itemDTO.getProdutoId());
            if (produtoOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Produto com ID " + itemDTO.getProdutoId() + " não encontrado.");
            }

            EntradaItem item = new EntradaItem();
            item.setEntrada(entrada);
            item.setProduto(produtoOpt.get());
            item.setQuantidade(itemDTO.getQuantidade());
            item.setPrecoUnitario(itemDTO.getPrecoUnitario());
            item.setFatorEntrada(itemDTO.getFatorEntrada());

            itens.add(item);
        }

        entrada.setItens(itens);
        entradaRepository.save(entrada);

        return ResponseEntity.status(HttpStatus.CREATED).body("Entrada registrada com sucesso.");
    }
}
