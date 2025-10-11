package com.PedAi.PedAi.services;

import com.PedAi.PedAi.DTO.ItemVendaDTO;
import com.PedAi.PedAi.DTO.VendaDTO;
import com.PedAi.PedAi.Model.Endereco;
import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.Pedido;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfService {

    public byte[] gerarPdfPedido(Pedido pedido) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, outputStream);

        document.open();

        Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24);
        Paragraph title = new Paragraph("PedAi", fontTitle);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Font fontSubtitle = FontFactory.getFont(FontFactory.HELVETICA, 16);
        Paragraph subtitle = new Paragraph("Comprovante de Pedido", fontSubtitle);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitle);
        document.add(Chunk.NEWLINE);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm", new Locale("pt", "BR"));
        document.add(new Paragraph("Pedido: #" + pedido.getId()));
        document.add(new Paragraph("Data: " + pedido.getDataPedido().format(formatter)));

        String tipoPedido = pedido.getTipo().toString().substring(0, 1).toUpperCase()
                + pedido.getTipo().toString().substring(1).toLowerCase();
        document.add(new Paragraph("Tipo do Pedido: " + tipoPedido));
        document.add(Chunk.NEWLINE);

        if (pedido.getCliente() != null) {
            Font fontHeaderCliente = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Paragraph clienteHeader = new Paragraph("Dados do Cliente", fontHeaderCliente);
            document.add(clienteHeader);
            document.add(new Paragraph("Nome: " + pedido.getCliente().getNome()));

            Endereco endereco = pedido.getEnderecoEntrega();
            if (endereco != null) {
                document.add(new Paragraph("Endereço de Entrega:"));
                String enderecoCompleto = String.format("%s, %s - %s, %s - %s",
                        endereco.getLogradouro(), endereco.getNumero(), endereco.getBairro(),
                        endereco.getCidade(), endereco.getEstado());
                document.add(new Paragraph(enderecoCompleto));
            }
            document.add(Chunk.NEWLINE);
        }

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1.5f, 7f, 2.5f });
        Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
        table.addCell(new PdfPCell(new Phrase("Qtd.", fontHeader)));
        table.addCell(new PdfPCell(new Phrase("Produto", fontHeader)));
        PdfPCell headerCell3 = new PdfPCell(new Phrase("Subtotal", fontHeader));
        headerCell3.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(headerCell3);

        for (ItemPedido item : pedido.getItens()) {
            table.addCell(String.valueOf(item.getQuantidade()));
            table.addCell(item.getProduto().getNome());
            PdfPCell cellValor = new PdfPCell(new Phrase(String.format("R$ %.2f", item.getSubtotal())));
            cellValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(cellValor);
        }
        document.add(table);

        Font fontTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Paragraph total = new Paragraph(String.format("Total: R$ %.2f", pedido.getTotal()), fontTotal);
        total.setAlignment(Element.ALIGN_RIGHT);
        document.add(Chunk.NEWLINE);
        document.add(total);

        document.close();
        return outputStream.toByteArray();
    }

    // --- NOVO MÉTODO ADICIONADO ---
    public byte[] gerarPdfVenda(VendaDTO venda) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A5); // A5 é um bom tamanho para recibos
        PdfWriter.getInstance(document, outputStream);

        document.open();

        Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Paragraph title = new Paragraph("PedAi - Comprovante de Venda", fontTitle);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss", new Locale("pt", "BR"));
        document.add(new Paragraph("Data: " + ZonedDateTime.now().format(formatter)));
        document.add(Chunk.NEWLINE);

        // Tabela de Itens
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 5f, 1.5f, 2.5f, 2.5f });
        Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
        table.addCell(new PdfPCell(new Phrase("Produto", fontHeader)));
        table.addCell(new PdfPCell(new Phrase("Qtd.", fontHeader)));
        table.addCell(new PdfPCell(new Phrase("Vlr. Unit.", fontHeader)));
        PdfPCell headerCell4 = new PdfPCell(new Phrase("Subtotal", fontHeader));
        headerCell4.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(headerCell4);

        for (ItemVendaDTO item : venda.getItens()) {
            table.addCell(item.getNome());
            table.addCell(String.valueOf(item.getQuantidade()));
            table.addCell(String.format("R$ %.2f", item.getPrecoUnitario()));
            PdfPCell cellValor = new PdfPCell(new Phrase(
                    String.format("R$ %.2f", item.getPrecoUnitario().multiply(new BigDecimal(item.getQuantidade())))));
            cellValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(cellValor);
        }
        document.add(table);
        document.add(Chunk.NEWLINE);

        // Seção de Totais
        Font fontTotals = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font fontTotalBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

        Paragraph subtotal = new Paragraph(String.format("Subtotal: R$ %.2f", venda.getSubtotal()), fontTotals);
        subtotal.setAlignment(Element.ALIGN_RIGHT);
        document.add(subtotal);

        if (venda.getDesconto() != null && venda.getDesconto().compareTo(BigDecimal.ZERO) > 0) {
            Paragraph desconto = new Paragraph(String.format("Desconto: - R$ %.2f", venda.getDesconto()), fontTotals);
            desconto.setAlignment(Element.ALIGN_RIGHT);
            document.add(desconto);
        }
        if (venda.getAcrescimo() != null && venda.getAcrescimo().compareTo(BigDecimal.ZERO) > 0) {
            Paragraph acrescimo = new Paragraph(String.format("Acréscimo: + R$ %.2f", venda.getAcrescimo()),
                    fontTotals);
            acrescimo.setAlignment(Element.ALIGN_RIGHT);
            document.add(acrescimo);
        }

        Paragraph total = new Paragraph(String.format("Total: R$ %.2f", venda.getTotal()), fontTotalBold);
        total.setAlignment(Element.ALIGN_RIGHT);
        document.add(total);

        document.close();
        return outputStream.toByteArray();
    }
}