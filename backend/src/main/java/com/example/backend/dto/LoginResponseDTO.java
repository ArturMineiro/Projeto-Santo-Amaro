package com.example.backend.dto;

public class LoginResponseDTO {
    private String token;
    private AssociationResponseDTO association;

    public LoginResponseDTO() {
    }

    public LoginResponseDTO(String token, AssociationResponseDTO association) {
        this.token = token;
        this.association = association;
    }

    public String getToken() {
        return token;
    }

    public AssociationResponseDTO getAssociation() {
        return association;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public void setAssociation(AssociationResponseDTO association) {
        this.association = association;
    }
}