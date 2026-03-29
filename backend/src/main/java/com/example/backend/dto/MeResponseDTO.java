package com.example.backend.dto;

public class MeResponseDTO {
    private UserResponseDTO user;
    private Object membership;
    private Object association;

    public MeResponseDTO() {
    }

    public MeResponseDTO(UserResponseDTO user, Object membership, Object association) {
        this.user = user;
        this.membership = membership;
        this.association = association;
    }

    public UserResponseDTO getUser() {
        return user;
    }

    public Object getMembership() {
        return membership;
    }

    public Object getAssociation() {
        return association;
    }

    public void setUser(UserResponseDTO user) {
        this.user = user;
    }

    public void setMembership(Object membership) {
        this.membership = membership;
    }

    public void setAssociation(Object association) {
        this.association = association;
    }
}