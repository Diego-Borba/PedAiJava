// src/main/java/com/PedAi/PedAi/DTO/ImagemDTO.java
package com.PedAi.PedAi.DTO;

public class ImagemDTO {
    private String imagemBase64;
    private String imagemTipo;

    public String getImagemBase64() {
        return imagemBase64;
    }
    public void setImagemBase64(String imagemBase64) {
        this.imagemBase64 = imagemBase64;
    }
    public String getImagemTipo() {
        return imagemTipo;
    }
    public void setImagemTipo(String imagemTipo) {
        this.imagemTipo = imagemTipo;
    }
}