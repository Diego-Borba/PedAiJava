package com.PedAi.PedAi.services;

import com.PedAi.PedAi.Model.ItemPedido;
import com.PedAi.PedAi.Model.Pedido;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfService {

    public byte[] gerarPdfPedido(Pedido pedido) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, outputStream);

        document.open();

        // Título Principal
        Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24);
        Paragraph title = new Paragraph("PedAi", fontTitle);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Font fontSubtitle = FontFactory.getFont(FontFactory.HELVETICA, 16);
        Paragraph subtitle = new Paragraph("Comprovante de Pedido", fontSubtitle);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitle);
        document.add(Chunk.NEWLINE);

        // Informações do Pedido
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm", new Locale("pt", "BR"));
        document.add(new Paragraph("Pedido: #" + pedido.getId()));
        document.add(new Paragraph("Data: " + pedido.getDataPedido().format(formatter)));
        if (pedido.getCliente() != null) {
            document.add(new Paragraph("Cliente: " + pedido.getCliente().getNome()));
        }
        document.add(new Paragraph("Status: " + pedido.getStatus()));
        document.add(Chunk.NEWLINE);

        // Tabela de Itens
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 7f, 2.5f});

        // Cabeçalho da Tabela
        Font fontHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
        table.addCell(new PdfPCell(new Phrase("Qtd.", fontHeader)));
        table.addCell(new PdfPCell(new Phrase("Produto", fontHeader)));
        PdfPCell headerCell3 = new PdfPCell(new Phrase("Subtotal", fontHeader));
        headerCell3.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(headerCell3);

        // Itens
        for (ItemPedido item : pedido.getItens()) {
            table.addCell(String.valueOf(item.getQuantidade()));
            table.addCell(item.getProduto().getNome());
            PdfPCell cellValor = new PdfPCell(new Phrase(String.format("R$ %.2f", item.getSubtotal())));
            cellValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(cellValor);
        }
        document.add(table);

        // Total
        Font fontTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Paragraph total = new Paragraph(String.format("Total: R$ %.2f", pedido.getTotal()), fontTotal);
        total.setAlignment(Element.ALIGN_RIGHT);
        document.add(Chunk.NEWLINE);
        document.add(total);

        document.close();
        return outputStream.toByteArray();
    }
}