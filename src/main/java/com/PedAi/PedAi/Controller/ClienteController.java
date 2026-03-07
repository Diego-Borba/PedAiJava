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
import org.springframework.transaction.annotation.Transactional;

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
        cliente.setSenha(passwordEncoder.encode(cliente.getSenha()));
        cliente.setRole(UserRole.USER);
        Cliente clienteSalvo = clienteRepository.save(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ClienteResponseDTO(clienteSalvo));
    }

    // CADASTRO VIA ADMIN/DEFAULT
    @PostMapping("/admin-cadastro")
    @Transactional
    public ResponseEntity<?> cadastrarClienteAdmin(@RequestBody Cliente cliente) {
        if (cliente.getNome() == null || cliente.getNome().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Nome é obrigatório.");
        }
        if (cliente.getTelefone() == null || cliente.getTelefone().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Telefone é obrigatório.");
        }
        String baseEmail = cliente.getEmail() != null && !cliente.getEmail().trim().isEmpty() ? 
                           cliente.getEmail().toLowerCase() : 
                           "avulso." + System.currentTimeMillis() + "@pedai.com";
        if (clienteRepository.findByEmail(baseEmail).isPresent() && cliente.getEmail() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("O e-mail informado já está em uso.");
        } 
        
        cliente.setEmail(baseEmail);
        cliente.setSenha(passwordEncoder.encode("pda-admin-default"));
        
        cliente.setRole(UserRole.USER); 
        
        try {
            Cliente clienteSalvo = clienteRepository.save(cliente);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ClienteResponseDTO(clienteSalvo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro interno ao salvar cliente.");
        }
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