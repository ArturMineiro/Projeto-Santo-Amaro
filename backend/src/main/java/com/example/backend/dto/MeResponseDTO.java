package com.example.backend.dto;

public class MeResponseDTO {

    private AssociationResponseDTO association;

    public MeResponseDTO() {
    }

    public MeResponseDTO(AssociationResponseDTO association) {
        this.association = association;
    }

    public AssociationResponseDTO getAssociation() {
        return association;
    }

    public void setAssociation(AssociationResponseDTO association) {
        this.association = association;
    }
}