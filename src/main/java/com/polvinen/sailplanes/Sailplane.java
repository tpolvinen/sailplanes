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

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

import lombok.Data;

// tag::code[]
@Data
@Entity
public class Sailplane {

	private @Id @GeneratedValue Long id;
	private String name;
    private int year;
    private String structure;
    private String inFlight;
    private String wingArea;
    private String wingLoading;
    private String aspectRatio;

	private Sailplane() {}

    public Sailplane(String name, int year, String structure, String inFlight, String wingArea, String wingLoading, String aspectRatio) {
        this.name = name;
        this.year = year;
        this.structure = structure;
        this.inFlight = inFlight;
        this.wingArea = wingArea;
        this.wingLoading = wingLoading;
        this.aspectRatio = aspectRatio;
    }
}
// end::code[]    