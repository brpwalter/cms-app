# CMS

Ein rollenbasiertes Content-Management-System zum Erstellen, Prüfen und Veröffentlichen von Seiten. Das Projekt besteht aus einem React-Frontend, einem Spring-Boot-Backend und PostgreSQL.

## Funktionen

- JWT-basierte Anmeldung und öffentliche Registrierung für Leser
- Benutzer- und Rollenverwaltung für Administratoren
- WYSIWYG-Editor für Editoren und Mitarbeitende
- Freigabe-Workflow: Mitarbeitende beantragen die Freigabe; Editoren und Administratoren können freigeben oder ablehnen
- Direkte Bearbeitung ausstehender Beiträge durch Editoren; Änderungen bleiben bis zur separaten Freigabe unveröffentlicht
- Korrekturkommentare zu markierten Textstellen, die Mitarbeitende im Editor wiederfinden
- Medienbibliothek zum Suchen, Hochladen und Einfügen von Bildern in Beiträge
- Erstellungs- und Änderungsdatum in der Beitragsübersicht
- Leser sehen veröffentlichte Seiten mit Inhaltsvorschau
- Serverseitige Rollen- und Seitenzugriffsprüfung

## Rollen

| Rolle | Berechtigungen |
| --- | --- |
| **Administrator** | Benutzer anlegen, bearbeiten, löschen und Rollen verwalten |
| **Editor** | Seiten erstellen, ausstehende Beiträge bearbeiten und freigeben, ablehnen oder mit Kommentaren zur Korrektur zurücksenden; Medien verwalten |
| **Mitarbeiter** | Seiten erstellen, Freigabe beantragen, eigene Beiträge und Rückmeldungen verwalten; Bilder hochladen und einfügen |
| **Leser** | Veröffentlichte Seiten ansehen und lesen |

Die öffentliche Registrierung weist neuen Konten automatisch die Rolle **Leser** zu. Die Benutzerverwaltung ist Administratoren vorbehalten.

Editoren können Korrekturkommentare an markierte Textstellen anhängen. Mitarbeitende sehen markierten Text und Kommentar und können die betreffende Stelle im Editor anwählen. Alternativ kann ein Editor einen ausstehenden Beitrag direkt bearbeiten; nach dem Speichern bleibt er unveröffentlicht und muss separat freigegeben werden.

Die Medienbibliothek unterstützt JPEG, PNG, GIF und WebP bis 10 MB pro Bild. Mitarbeitende und Editoren können Bilder suchen, hochladen und in den Beitrag einfügen. Löschen dürfen nur Editoren und Administratoren. Dateien werden standardmässig lokal unter `uploads` im Backend-Arbeitsverzeichnis gespeichert; bereits in Beiträgen verwendete Bilder werden beim Löschen nicht automatisch ersetzt.

## Voraussetzungen

- Java 21
- Node.js 20.19+ oder 22.12+
- PostgreSQL

Maven und die Frontend-Abhängigkeiten werden über den Maven Wrapper beziehungsweise npm verwaltet.

## Lokaler Start

### 1. PostgreSQL vorbereiten

Erstelle eine leere PostgreSQL-Datenbank mit dem Namen `cms`. Die Backend-Konfiguration verwendet standardmässig `localhost:5432` und den Datenbankbenutzer `postgres`. Zugangsdaten können vor dem Start über die Spring-Umgebungsvariablen gesetzt werden:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/cms"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "<dein-datenbankpasswort>"
```

Hibernate aktualisiert das Datenbankschema beim Start (`spring.jpa.hibernate.ddl-auto=update`). Das ergänzende SQL-Schema ist unter [`sql/schema.sql.txt`](./sql/schema.sql.txt) dokumentiert. Bei einer bestehenden Datenbank müssen neue Check-Constraints und die Kommentartabelle einmalig angewendet werden:

```powershell
psql -d cms -U postgres -f .\sql\migrations\20261029_expand_page_approval_status.sql
psql -d cms -U postgres -f .\sql\migrations\20261029_create_page_correction_comments.sql
```

Die Upload-Grenze des Backends ist auf 10 MB pro Datei und 12 MB pro Multipart-Anfrage gesetzt.

### 2. JWT-Schlüssel setzen

Das Backend benötigt `JWT_SECRET`: einen Base64-kodierten Schlüssel mit mindestens 32 zufälligen Bytes. Für eine lokale PowerShell-Sitzung kann ein Schlüssel erzeugt werden:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
```

Der Schlüssel muss für alle Backend-Neustarts gleich bleiben, solange bestehende Tokens gültig sein sollen. In Produktion gehört er in einen Secret Store oder eine geschützte Umgebungsvariable, nicht ins Repository.

### 3. Backend starten

In einer PowerShell im Repository-Verzeichnis:

```powershell
Set-Location .\cms_backend\cms
.\mvnw.cmd spring-boot:run
```

Die REST-API ist standardmässig unter `http://localhost:8080/api` erreichbar.

### 4. Frontend starten

In einem zweiten Terminal:

```powershell
Set-Location .\cms_frontend
npm.cmd ci
npm.cmd run dev
```

Vite zeigt die lokale URL an; standardmässig ist das `http://localhost:5173`. Das Frontend verwendet die API unter `http://localhost:8080/api`.

## API-Überblick

| Methode | Pfad | Zugriff |
| --- | --- | --- |
| `POST` | `/api/public/auth/register` | Öffentlich; registriert ein Leser-Konto |
| `POST` | `/api/public/auth/login` | Öffentlich; liefert ein JWT |
| `GET` | `/api/pages` | Angemeldet; Ergebnisse abhängig von der Rolle |
| `GET` | `/api/pages/preview/{slug}` | Angemeldet; Vorschau gemäss Rollenrechten |
| `POST` | `/api/pages` | Admin, Editor oder Mitarbeiter |
| `PUT` / `DELETE` | `/api/pages/{id}` | Angemeldet; Rolle und bei Mitarbeitenden Eigentümerschaft werden geprüft |
| `POST` | `/api/pages/{id}/approve` | Admin oder Editor |
| `POST` | `/api/pages/{id}/request-changes` | Admin oder Editor; Kommentar zu markierten Textstellen |
| `POST` | `/api/pages/{id}/reject` | Admin oder Editor; mit Begründung |
| `GET` / `POST` | `/api/admin/users` | Admin |
| `PUT` / `DELETE` | `/api/admin/users/{id}` | Admin |
| `GET` | `/api/admin/media` | Admin, Editor oder Mitarbeiter |
| `POST` | `/api/admin/media/upload` | Admin, Editor oder Mitarbeiter; Bild bis 10 MB |
| `DELETE` | `/api/admin/media/{fileName}` | Admin oder Editor |

## Qualitätssicherung

Frontend-Build und Lint:

```powershell
Set-Location .\cms_frontend
npm.cmd run build
npm.cmd run lint
```

Backend-Build und Tests:

```powershell
Set-Location .\cms_backend\cms
.\mvnw.cmd '-Dtest=MediaControllerTest,PageServiceTest' test
```

Der vollständige Testlauf enthält zusätzlich `CmsApplicationTests` im Paket `com.example.cms`; dieser vorhandene `@SpringBootTest` findet die Anwendungskonfiguration im Paket `com.cms` derzeit nicht automatisch.

## Sicherheitshinweise

- Keine echten Datenbankpasswörter, JWT-Schlüssel oder produktiven Zugangsdaten committen.
- Vor einem produktiven Betrieb Initialzugangsdaten ändern und als Secrets verwalten.
- `spring.jpa.hibernate.ddl-auto=update` ist für die lokale Entwicklung gedacht. Für Produktion Schemaänderungen mit versionierten Datenbankmigrationen verwalten.
- Die Backend-API prüft Zugriffsrechte unabhängig von der Frontend-Routenprüfung.

## Weiterführende Dokumentation

Details zum Datenmodell und Rollenkonzept stehen in der [CMS-Dokumentation](./CMS_Dokumentation.md).
