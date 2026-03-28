package com.example.backend.controller;

import com.example.backend.entity.Membership;
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
    public Membership approve(@PathVariable Long id) {
        return membershipService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public Membership reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return membershipService.reject(id, body.get("rejection_reason"));
    }
}