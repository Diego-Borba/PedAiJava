package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.VendaDTO;
import com.PedAi.PedAi.Model.Venda;
import com.PedAi.PedAi.repository.VendaRepository;
import com.PedAi.PedAi.services.PdfService;
import com.PedAi.PedAi.services.VendaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    @Autowired
    private PdfService pdfService;

    @Autowired
    private VendaService vendaService;

    @Autowired
    private VendaRepository vendaRepository;

    @PostMapping("/registrar")
    public ResponseEntity<?> registrarVenda(@RequestBody VendaDTO vendaDTO) {
        try {
            Venda novaVenda = vendaService.registrarVenda(vendaDTO);
            return ResponseEntity.ok(Map.of("id", novaVenda.getId(), "message", "Venda registrada com sucesso!"));
        } catch (Exception e) {
            System.err.println("Erro ao registrar venda: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro ao registrar venda."));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendaDTO> getVendaPorId(@PathVariable Long id) {
        Optional<Venda> vendaOptional = vendaRepository.findById(id);
        return vendaOptional.map(venda -> ResponseEntity.ok(new VendaDTO(venda)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarVenda(@PathVariable Long id) {
        if (!vendaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        vendaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/imprimir-pdf")
    public ResponseEntity<byte[]> gerarPdfVenda(@RequestBody VendaDTO vendaDTO) {
        try {
            byte[] pdfBytes = pdfService.gerarPdfVenda(vendaDTO);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=venda.pdf")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            System.err.println("Erro ao gerar PDF da venda: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}