package com.example.backend.controller;

import com.example.backend.dto.MembershipResponseDTO;
import com.example.backend.service.MembershipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/memberships")
public class MembershipController {

    @Autowired
    private MembershipService membershipService;

    @GetMapping("/pending")
    public List<MembershipResponseDTO> pending() {
        return membershipService.listPending();
    }

    @PostMapping("/{id}/approve")
    public MembershipResponseDTO approve(@PathVariable Long id) {
        return membershipService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public MembershipResponseDTO reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return membershipService.reject(id, body.get("rejection_reason"));
    }
}