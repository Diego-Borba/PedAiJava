package com.PedAi.PedAi.services;

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

        // --- SEÇÃO DE INFORMAÇÕES (ATUALIZADA) ---
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm", new Locale("pt", "BR"));
        document.add(new Paragraph("Pedido: #" + pedido.getId()));
        document.add(new Paragraph("Data: " + pedido.getDataPedido().format(formatter)));
        
        // ADICIONADO: Tipo do pedido
        String tipoPedido = pedido.getTipo().toString().substring(0, 1).toUpperCase() + pedido.getTipo().toString().substring(1).toLowerCase();
        document.add(new Paragraph("Tipo do Pedido: " + tipoPedido));

        // REMOVIDO: Status do pedido
        // document.add(new Paragraph("Status: " + pedido.getStatus()));
        document.add(Chunk.NEWLINE);

        // --- ADICIONADO: SEÇÃO DE DADOS DO CLIENTE E ENTREGA ---
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
        table.setWidths(new float[]{1.5f, 7f, 2.5f});
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
}