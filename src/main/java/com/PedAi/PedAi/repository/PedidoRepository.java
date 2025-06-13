package com.PedAi.PedAi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.PedAi.PedAi.Model.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByClienteIdOrderByDataPedidoDesc(Long clienteId);
}