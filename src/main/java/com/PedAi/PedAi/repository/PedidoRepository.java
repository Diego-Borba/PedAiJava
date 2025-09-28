package com.PedAi.PedAi.repository;

import com.PedAi.PedAi.Model.Pedido;
import com.PedAi.PedAi.Model.TipoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // Importante
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long>, JpaSpecificationExecutor<Pedido> {

    List<Pedido> findByClienteIdOrderByDataPedidoDesc(Long clienteId);

}