package com.PedAi.PedAi.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PedAi.PedAi.Model.Fornecedor;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {

    List<Fornecedor> findByNomeContainingIgnoreCase(String nome);
}
