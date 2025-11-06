// src/main/java/com/adi/docflow/web/GrdController.java
package com.adi.docflow.web;

import com.adi.docflow.web.dto.GrdCreateDTO;
import com.adi.docflow.web.dto.GrdResponseDTO;
import com.adi.docflow.service.GrdService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/grds")
public class GrdController {

    private final GrdService grdService;

    public GrdController(GrdService grdService) {
        this.grdService = grdService;
    }

    @PostMapping
    public ResponseEntity<GrdResponseDTO> create(@RequestBody GrdCreateDTO dto) {
        return ResponseEntity.ok(grdService.create(dto));
    }

    @GetMapping("/by-protocol/{protocol}")
    public ResponseEntity<GrdResponseDTO> getByProtocol(@PathVariable String protocol) {
        return grdService.findByProtocol(protocol)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
