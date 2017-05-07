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

import static com.polvinen.sailplanes.WebSocketConfiguration.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

// tag::code[]
@Component
@RepositoryEventHandler(Sailplane.class)
public class EventHandler {

	private final SimpMessagingTemplate websocket;

	private final EntityLinks entityLinks;

	@Autowired
	public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
		this.websocket = websocket;
		this.entityLinks = entityLinks;
	}

	@HandleAfterCreate
	public void newSailplane(Sailplane sailplane) {
		this.websocket.convertAndSend(
				MESSAGE_PREFIX + "/newSailplane", getPath(sailplane));
	}

	@HandleAfterDelete
	public void deleteEmployee(Sailplane sailplane) {
		this.websocket.convertAndSend(
				MESSAGE_PREFIX + "/deleteSailplane", getPath(sailplane));
	}

	@HandleAfterSave
	public void updateSailplane(Sailplane sailplane) {
		this.websocket.convertAndSend(
				MESSAGE_PREFIX + "/updateSailplane", getPath(sailplane));
	}

	/**
	 * Take an {@link Sailplane} and get the URI using Spring Data REST's {@link EntityLinks}.
	 *
	 * @param sailplane
	 */
	private String getPath(Sailplane sailplane) {
		return this.entityLinks.linkForSingleResource(sailplane.getClass(),
				sailplane.getId()).toUri().getPath();
	}

}
// end::code[]
