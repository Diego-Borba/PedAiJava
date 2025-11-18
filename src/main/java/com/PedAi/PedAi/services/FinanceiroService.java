package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ContaAPagarInputDTO;
import com.PedAi.PedAi.DTO.ContaAReceberInputDTO;
import com.PedAi.PedAi.Model.*;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.repository.ContaAPagarRepository;
import com.PedAi.PedAi.repository.ContaAReceberRepository;
import com.PedAi.PedAi.repository.FornecedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class FinanceiroService {

    @Autowired private ContaAReceberRepository contaAReceberRepository;
    @Autowired private ContaAPagarRepository contaAPagarRepository;
    @Autowired private ClienteRepository clienteRepository;
    @Autowired private FornecedorRepository fornecedorRepository;

    // --- MÉTODOS PARA CONTAS A RECEBER ---

    @Transactional
    public void criarContaAReceberDePedido(Pedido pedido) {
        ContaAReceber conta = new ContaAReceber();
        conta.setPedido(pedido);
        conta.setCliente(pedido.getCliente());
        conta.setClienteNome(pedido.getCliente().getNome());
        conta.setValorTotal(pedido.getTotal());
        conta.setOrigem("Pedido #" + pedido.getId());
        conta.setDataVencimento(LocalDate.now());
        conta.setStatus(StatusContaAReceber.A_RECEBER);
        conta.setValorRecebido(BigDecimal.ZERO);
        contaAReceberRepository.save(conta);
    }

    // --- NOVO MÉTODO PARA VENDA A PRAZO ---
    @Transactional
    public void criarContaAReceberDeVenda(Venda venda, BigDecimal valor, LocalDate dataVencimento) {
        ContaAReceber conta = new ContaAReceber();
        // Venda não tem relação direta OneToOne com ContaAReceber no modelo atual, 
        // então usamos a origem como referência texto
        conta.setCliente(venda.getCliente());
        conta.setClienteNome(venda.getCliente().getNome());
        conta.setValorTotal(valor);
        conta.setOrigem("Venda (PDV) #" + venda.getId());
        conta.setDataVencimento(dataVencimento);
        conta.setStatus(StatusContaAReceber.A_RECEBER);
        conta.setValorRecebido(BigDecimal.ZERO);
        
        contaAReceberRepository.save(conta);
    }

    @Transactional
    public ContaAReceber criarOuAtualizarContaAReceber(Long id, ContaAReceberInputDTO dto) {
        ContaAReceber conta = (id != null) ? contaAReceberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conta a receber com ID " + id + " não encontrada."))
                : new ContaAReceber();

        if (dto.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(dto.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente com ID " + dto.getClienteId() + " não encontrado."));
            conta.setCliente(cliente);
            conta.setClienteNome(cliente.getNome());
        } else {
            conta.setCliente(null);
            conta.setClienteNome(dto.getClienteNomeAvulso());
        }

        conta.setOrigem(dto.getOrigem());
        conta.setValorTotal(dto.getValorTotal());
        conta.setDataVencimento(dto.getDataVencimento());
        
        if (id == null) {
            conta.setStatus(StatusContaAReceber.A_RECEBER);
            conta.setValorRecebido(BigDecimal.ZERO);
        }

        return contaAReceberRepository.save(conta);
    }
    
    @Transactional
    public ContaAReceber registrarPagamentoAReceber(Long contaId, BigDecimal valorPago, LocalDate dataPagamento) {
        ContaAReceber conta = contaAReceberRepository.findById(contaId)
                .orElseThrow(() -> new RuntimeException("Conta a receber com ID " + contaId + " não encontrada."));

        conta.setValorRecebido(conta.getValorRecebido().add(valorPago));
        conta.setDataRecebimento(dataPagamento);

        if (conta.getValorRecebido().compareTo(conta.getValorTotal()) >= 0) {
            conta.setStatus(StatusContaAReceber.RECEBIDO);
            conta.setValorRecebido(conta.getValorTotal());
        } else {
            conta.setStatus(StatusContaAReceber.PARCIALMENTE_PAGO);
        }

        return contaAReceberRepository.save(conta);
    }

    @Transactional
    public void deletarContaAReceber(Long id) {
        if (!contaAReceberRepository.existsById(id)) {
            throw new RuntimeException("Conta a receber com ID " + id + " não encontrada.");
        }
        contaAReceberRepository.deleteById(id);
    }
    
    // --- MÉTODOS PARA CONTAS A PAGAR ---

    @Transactional
    public ContaAPagar criarOuAtualizarContaAPagar(Long id, ContaAPagarInputDTO dto) {
        ContaAPagar conta = (id != null) ? contaAPagarRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conta a pagar com ID " + id + " não encontrada."))
                : new ContaAPagar();

        if (dto.getFornecedorId() != null) {
            Fornecedor fornecedor = fornecedorRepository.findById(dto.getFornecedorId())
                    .orElseThrow(() -> new RuntimeException("Fornecedor com ID " + dto.getFornecedorId() + " não encontrado."));
            conta.setFornecedor(fornecedor);
        } else {
            conta.setFornecedor(null);
        }

        conta.setDescricao(dto.getDescricao());
        conta.setValorTotal(dto.getValorTotal());
        conta.setDataVencimento(dto.getDataVencimento());

        if (id == null) {
            conta.setStatus(StatusContaAPagar.A_PAGAR);
            conta.setValorPago(BigDecimal.ZERO);
        }

        return contaAPagarRepository.save(conta);
    }
    
    @Transactional
    public ContaAPagar registrarPagamentoAPagar(Long contaId, BigDecimal valorPago, LocalDate dataPagamento) {
        ContaAPagar conta = contaAPagarRepository.findById(contaId)
                .orElseThrow(() -> new RuntimeException("Conta a pagar com ID " + contaId + " não encontrada."));

        conta.setValorPago(conta.getValorPago().add(valorPago));
        conta.setDataPagamento(dataPagamento);

        if (conta.getValorPago().compareTo(conta.getValorTotal()) >= 0) {
            conta.setStatus(StatusContaAPagar.PAGO);
            conta.setValorPago(conta.getValorTotal());
        } else {
            conta.setStatus(StatusContaAPagar.PARCIALMENTE_PAGO);
        }

        return contaAPagarRepository.save(conta);
    }

    @Transactional
    public void deletarContaAPagar(Long id) {
        if (!contaAPagarRepository.existsById(id)) {
            throw new RuntimeException("Conta a pagar com ID " + id + " não encontrada.");
        }
        contaAPagarRepository.deleteById(id);
    }
}