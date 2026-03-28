package com.example.backend.controller;

import com.example.backend.entity.PackageEntity;
import com.example.backend.entity.User;
import com.example.backend.service.PackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/packages")
public class PackageController {

    @Autowired
    private PackageService packageService;

    @GetMapping
    public List<PackageEntity> index() {
        User fakeUser = new User();
        fakeUser.setId(1L);
        fakeUser.setRole("admin");

        return packageService.list(fakeUser);
    }

    @PostMapping
    public PackageEntity store(@RequestBody Map<String, String> body) {

        User fakeUser = new User();
        fakeUser.setId(1L);

        return packageService.create(
                fakeUser,
                Long.parseLong(body.get("resident_id")),
                body.get("description"),
                body.get("tracking_code"));
    }

    @PatchMapping("/{id}/status")
    public PackageEntity updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return packageService.updateStatus(id, body.get("status"));
    }
}