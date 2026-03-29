package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "packages")
public class PackageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;
    private String trackingCode;
    private String status;

    private LocalDateTime arrivalDate;
    private LocalDateTime notificationSentAt;
    private LocalDateTime pickedUpAt;

    @ManyToOne
    @JoinColumn(name = "association_id")
    private AssociationEntity association;

    @ManyToOne
    @JoinColumn(name = "resident_id")
    private UserEntity resident;

    @ManyToOne
    @JoinColumn(name = "received_by")
    private UserEntity receiver;

    // ✅ GETTERS E SETTERS

    public Long getId() {
        return id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTrackingCode() {
        return trackingCode;
    }

    public void setTrackingCode(String trackingCode) {
        this.trackingCode = trackingCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getArrivalDate() {
        return arrivalDate;
    }

    public void setArrivalDate(LocalDateTime arrivalDate) {
        this.arrivalDate = arrivalDate;
    }

    public LocalDateTime getNotificationSentAt() {
        return notificationSentAt;
    }

    public void setNotificationSentAt(LocalDateTime notificationSentAt) {
        this.notificationSentAt = notificationSentAt;
    }

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    public AssociationEntity getAssociation() {
        return association;
    }

    public void setAssociation(AssociationEntity association) {
        this.association = association;
    }

    public UserEntity getResident() {
        return resident;
    }

    public void setResident(UserEntity resident) {
        this.resident = resident;
    }

    public UserEntity getReceiver() {
        return receiver;
    }

    public void setReceiver(UserEntity receiver) {
        this.receiver = receiver;
    }
}