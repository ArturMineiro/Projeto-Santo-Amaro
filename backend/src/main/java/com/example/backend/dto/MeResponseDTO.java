package com.example.backend.dto;

public class MeResponseDTO {
    private UserResponseDTO user;
    private MembershipResponseDTO membership;
    private AssociationResponseDTO association;

    public MeResponseDTO(UserResponseDTO user, MembershipResponseDTO membership, AssociationResponseDTO association) {
        this.user = user;
        this.membership = membership;
        this.association = association;
    }

    public UserResponseDTO getUser() {
        return user;
    }

    public void setUser(UserResponseDTO user) {
        this.user = user;
    }

    public MembershipResponseDTO getMembership() {
        return membership;
    }

    public void setMembership(MembershipResponseDTO membership) {
        this.membership = membership;
    }

    public AssociationResponseDTO getAssociation() {
        return association;
    }

    public void setAssociation(AssociationResponseDTO association) {
        this.association = association;
    }
}