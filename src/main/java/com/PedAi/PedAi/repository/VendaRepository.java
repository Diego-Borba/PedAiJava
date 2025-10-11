package com.PedAi.PedAi.repository;

import com.PedAi.PedAi.Model.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface VendaRepository extends JpaRepository<Venda, Long>, JpaSpecificationExecutor<Venda> {
}