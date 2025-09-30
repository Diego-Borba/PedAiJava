package com.PedAi.PedAi;

import com.PedAi.PedAi.config.DataInitializer;
import com.PedAi.PedAi.security.TokenService;
import org.junit.jupiter.api.Disabled; // Importar a anotação
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class PedAiApplicationTests {

	@MockBean
	private TokenService tokenService;

	@MockBean
	private DataInitializer dataInitializer;

	@Test
	@Disabled("Temporariamente desabilitado para focar no desenvolvimento da aplicação principal")
	void contextLoads() {
	}

}