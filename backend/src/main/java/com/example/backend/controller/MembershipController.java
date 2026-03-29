package com.example.backend.controller;

import com.example.backend.entity.MembershipEntity;
import com.example.backend.service.MembershipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/memberships")
public class MembershipController {

    @Autowired
    private MembershipService membershipService;

    @PostMapping("/{id}/approve")
    public MembershipEntity approve(@PathVariable Long id) {
        return membershipService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public MembershipEntity reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return membershipService.reject(id, body.get("rejection_reason"));
    }
}