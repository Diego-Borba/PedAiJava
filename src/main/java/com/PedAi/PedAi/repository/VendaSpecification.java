package com.PedAi.PedAi.repository;

import com.PedAi.PedAi.Model.*;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class VendaSpecification {

    public static Specification<Venda> comFiltros(
            Long clienteId, Long produtoId, String formaPagamento, ZonedDateTime dataInicial, ZonedDateTime dataFinal) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            query.distinct(true); // Garante que não haja vendas duplicadas se um produto for comprado várias vezes

            if (clienteId != null) {
                predicates.add(criteriaBuilder.equal(root.get("cliente").get("id"), clienteId));
            }

            if (produtoId != null) {
                Join<Venda, ItemVenda> itemVendaJoin = root.join("itens");
                predicates.add(criteriaBuilder.equal(itemVendaJoin.get("produto").get("id"), produtoId));
            }

            if (StringUtils.hasText(formaPagamento)) {
                Join<Venda, PagamentoVenda> pagamentoVendaJoin = root.join("pagamentos");
                predicates.add(criteriaBuilder.equal(pagamentoVendaJoin.get("forma"), formaPagamento));
            }

            if (dataInicial != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("dataVenda"), dataInicial));
            }

            if (dataFinal != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("dataVenda"), dataFinal));
            }

            // Ordena pelas vendas mais recentes primeiro
            query.orderBy(criteriaBuilder.desc(root.get("dataVenda")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}