package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.UserRole;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.DTO.LoginRequestDTO;
import com.PedAi.PedAi.DTO.ClienteResponseDTO;
import com.PedAi.PedAi.DTO.ClienteSearchDTO;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("api/clientes")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/cadastro")
    public ResponseEntity<?> cadastrarCliente(@RequestBody Cliente cliente) {
        if (cliente.getEmail() == null || cliente.getEmail().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email não pode ser vazio");
        }
        // Criptografar a senha antes de salvar
        cliente.setSenha(passwordEncoder.encode(cliente.getSenha()));
        cliente.setRole(UserRole.USER); // Definir permissão padrão
        Cliente clienteSalvo = clienteRepository.save(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ClienteResponseDTO(clienteSalvo));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        Optional<Cliente> clienteOptional = clienteRepository.findByEmail(loginRequest.getEmail());

        if (clienteOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos.");
        }

        Cliente cliente = clienteOptional.get();
        if (passwordEncoder.matches(loginRequest.getSenha(), cliente.getSenha())) {
            return ResponseEntity.ok(new ClienteResponseDTO(cliente));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("E-mail ou senha inválidos.");
        }
    }

    @GetMapping("/search")
    public List<ClienteSearchDTO> searchClientes(
            @RequestParam(value = "q", required = false, defaultValue = "") String query) {
        List<Cliente> clientes = clienteRepository.findByNomeContainingIgnoreCase(query);
        return clientes.stream()
                .map(ClienteSearchDTO::new)
                .collect(Collectors.toList());
    }

}
