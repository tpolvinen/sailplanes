/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.polvinen.sailplanes;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// tag::code[]
@Component
public class DatabaseLoader implements CommandLineRunner {

	private final SailplaneRepository spRepository;
	private final UserRepository uRepository;

	@Autowired
	public DatabaseLoader(SailplaneRepository spRepository, UserRepository uRepository) {
		this.spRepository = spRepository;
		this.uRepository = uRepository;
	}

	@Override
	public void run(String... strings) throws Exception {

		User user1 = new User("user", "$2a$06$3jYRJrg0ghaaypjZ/.g4SethoeA51ph3UD4kZi9oPkeMTpjKU5uo6", "USER");
		User user2 = new User("admin", "$2a$10$0MMwY.IQqpsVc1jC8u7IJ.2rT8b0Cd3b3sfIBGV2zfgnPGtT4r0.C", "ADMIN");
		this.uRepository.save(user1);
		this.uRepository.save(user2);

		this.spRepository.save(new Sailplane("Vampyr", 1921, "120 kg", "195 kg", "16 sq m", "12 kg/sq m", "9,95"));
		this.spRepository.save(new Sailplane("Harth-Messerschmitt S-10", 1921, "80 kg", "150 kg", "10,3 sq m", "7,9 kg/sq m", "10,3"));
        this.spRepository.save(new Sailplane("Fokker Biplane", 1922, "93 kg", "163 kg", "36 sq m", "4,5 kg/sq m", "---"));
	}
}
// end::code[]