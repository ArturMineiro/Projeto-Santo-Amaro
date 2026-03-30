package com.example.backend.controller;

import com.example.backend.dto.ResidentRequestDTO;
import com.example.backend.entity.ResidentEntity;
import com.example.backend.service.ResidentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {

    @Autowired
    private ResidentService residentService;

    @PostMapping("/{associationId}")
    public ResidentEntity create(
            @PathVariable Long associationId,
            @RequestBody ResidentRequestDTO dto) {
        return residentService.create(associationId, dto);
    }
}