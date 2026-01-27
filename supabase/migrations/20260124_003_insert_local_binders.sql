-- ============================================================================
-- MIGRATION: Insert Local Compliance Binders
-- ============================================================================
-- Populates the local_compliance_binders table with 3 local binders:
--   1. Pittsburgh, PA (city)
--   2. Linden, NJ (city)
--   3. Queens County, NY (county)
--
-- These are pre-populated system content - NOT user-owned.
-- ============================================================================

-- ============================================================================
-- 1. PITTSBURGH, PENNSYLVANIA (CITY)
-- ============================================================================

INSERT INTO public.local_compliance_binders (
  location_name,
  location_type,
  state_code,
  title,
  content,
  word_count,
  section_headers,
  metadata
) VALUES (
  'Pittsburgh',
  'city',
  'PA',
  'Compliance Binder: Independent Shared Housing, Pittsburgh, Pennsylvania',
  E'# **Compliance Binder: Independent Shared Housing, Pittsburgh, Pennsylvania**

## **Highlight Instructions**

**For each document referenced in this binder, highlight the following parts when reviewing or printing the full documents:**

**These highlight instructions provide the specific sentences or sections to mark in the original documents so that a printed binder will clearly emphasize the key points supporting the shared housing model.**

## **Section 1 — Introduction, Usage, Language Guidelines & Housing Model Overview**

### **1A. Purpose and Use of the Binder**

This compliance binder consolidates applicable federal, state, and local regulatory references demonstrating that the residence operates as **independent shared housing** within the City of Pittsburgh. The materials establish that the housing model provides **housing only** and does not include supervision, personal care, case management, or coordinated services. Accordingly, the residence does not fall within classifications requiring licensure as an assisted living residence, personal care home, or other regulated care facility under Pennsylvania law.

The binder is maintained as a centralized reference to document regulatory alignment and to provide clarity regarding the legal framework governing shared housing in Pittsburgh. It reflects current statutes, administrative regulations, and municipal ordinances relevant to residential occupancy, zoning, and fair housing. The binder is intended to remain available in the event of inquiries from municipal officials, inspectors, or other stakeholders seeking to understand the nature and classification of the housing model.

📍 **Purpose:** Establishes why this binder exists and documents its role as a reference demonstrating regulatory alignment for an independent shared-housing model in Pittsburgh.

### **1B. Housing Model Overview**

The residence operates as **independent shared housing**, defined as a private residential dwelling occupied by unrelated adults who share common living spaces. The housing arrangement provides shelter only. Residents independently manage their own daily activities, meals, personal care, transportation, and any services they may choose to obtain on their own.

No services are provided, arranged, coordinated, or overseen by the operator or landlord. There is no on-site staff, supervision, monitoring, or case management. The residence is leased under standard residential lease terms and is not operated as a congregate living facility, care setting, or lodging establishment. The housing is not marketed or represented as assisted living, supportive housing, or any form of residential care. This housing model is intentionally structured to remain within the scope of **unlicensed residential use** under Pennsylvania law.

📍 **Purpose:** Describes the shared-housing model in factual terms to clearly distinguish it from licensed or service-based residential settings.

### **1C. Language and Operations Guardrails**

Consistent terminology and operations are essential to maintaining the proper classification of the residence as independent shared housing. All written, verbal, and marketing descriptions of the residence use neutral residential language such as **"shared housing," "independent housing," or "housemates."** Terminology that implies services, supervision, or care—including "group home," "assisted living," "personal care home," "supportive housing," or "boarding house"—is not used.

Operationally, the residence does not provide meals, transportation, medication assistance, supervision, or personal care. No house rules or policies are imposed that resemble institutional oversight. Lease agreements reflect standard landlord-tenant relationships rather than individual rooming arrangements or service-based occupancy.

📍 **Purpose:** Prevents accidental misclassification by aligning language and operations with a housing-only, unlicensed residential model.

## **Section 2 — Definitions of Licensed vs. Unlicensed Facilities & Distinction from Rooming and Boarding Houses**

### **2A. Licensed vs. Unlicensed Facility Definitions (Pennsylvania)**

In Pennsylvania, residential facilities are subject to licensure **only when housing is combined with the provision, arrangement, or coordination of care or services**. Facilities such as **personal care homes** and **assisted living residences** are licensed and regulated by the Pennsylvania Department of Human Services under Title 55 of the Pennsylvania Code.

Under 55 Pa. Code Chapters 2600 and 2800, a personal care home or assisted living residence is defined as a facility that provides housing **and** assistance with activities of daily living, supervision, or other supportive services to residents. The regulatory trigger for licensure is the **delivery or coordination of care or services**, not shared occupancy alone. Independent shared housing that provides only shelter and no personal care, supervision, medication management, or coordinated services does **not** meet the statutory or regulatory definitions requiring licensure.

#### **Primary Authority — Documents to Insert**

* **55 Pa. Code § 2600.4 — Definitions (Personal Care Homes)**
  [https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/055/chapter2600/s2600.4.html](https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/055/chapter2600/s2600.4.html)
  🖍 Highlight the definition of *"Personal care home"* and references to assistance with activities of daily living or supervision.
* **55 Pa. Code § 2800.4 — Definitions (Assisted Living Residences)**
  [https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/055/chapter2800/s2800.4.html](https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/055/chapter2800/s2800.4.html)
  🖍 Highlight the definition of *"Assisted living residence"* and references to supportive services.

📍 **Purpose:** Establishes the service-based threshold for licensure in Pennsylvania and confirms that housing-only shared living does not require Department of Human Services licensure.

### **2B. Distinction from Rooming and Boarding Houses (Pittsburgh)**

The City of Pittsburgh regulates **rooming houses and lodging uses** through municipal zoning and property-maintenance codes. These uses are distinct from standard residential dwellings and are subject to zoning approval, licensing, and inspection requirements.

Rooming houses generally involve the rental of **individual sleeping rooms**, often with shared facilities, and may require specific zoning approvals. Independent shared housing differs in that residents occupy the dwelling as a single household under standard residential lease terms and do not rent individual rooms as separate lodging units. The shared-housing model described herein is not operated as a rooming house, does not provide meals or services, and does not function as a transient or lodging use under Pittsburgh regulations.

#### **Primary Authority — Documents to Insert**

* **Pittsburgh Zoning Code — Definitions**
   [https://ecode360.com/45479736](https://ecode360.com/45479736)
  🖍 Highlight definitions of *"Rooming house," "lodging house,"* or similar terms describing individual room rentals.
* **Pittsburgh Code of Ordinances — Permits and Licenses**
  [https://www.alleghenycounty.us/Services/Health-Department/Housing-and-Community-Environment/Rooming-Inspections-and-Permits](https://www.alleghenycounty.us/Services/Health-Department/Housing-and-Community-Environment/Rooming-Inspections-and-Permits)
  [https://www.alleghenycounty.us/files/assets/county/v/4/government/health/documents/housing-and-community/article-6-hac.pdf](https://www.alleghenycounty.us/files/assets/county/v/4/government/health/documents/housing-and-community/article-6-hac.pdf)
  🖍 Highlight licensing or permitting language applicable to regulated residential or lodging uses.

📍 **Purpose:** Differentiates shared housing from regulated rooming or lodging houses under Pittsburgh law.

## **Section 3 — City & County Zoning and Permitting Guidelines (Pittsburgh, PA)**

### **3A. State and Local Occupancy Rules (Pittsburgh)**

Residential occupancy in Pittsburgh is governed by municipal zoning and property-maintenance codes that regulate household composition and minimum space standards. These rules are intended to preserve residential character and prevent conversion to lodging or institutional uses. Pittsburgh zoning regulates how many unrelated persons may reside together based on dwelling classification and zoning district. Compliance with these rules supports lawful residential use rather than regulated rooming or lodging use.

The City of Pittsburgh enforces the 2021 International Property Maintenance Code (IPMC) for all residential housing conditions and occupancy standards. Under Chapter 4 of the IPMC, bedrooms must meet minimum space requirements to ensure safe and non-overcrowded living conditions.

### **Bedroom Occupancy & Minimum Size Chart (IPMC Standards — Pittsburgh):**

| Number of Occupants in Bedroom | Minimum Floor Area Required |
| ----- | ----- |
| 1 person | ≥ 70 sq ft |
| 2 persons | ≥ 100 sq ft (50 sq ft × 2) |
| 3 persons | ≥ 150 sq ft (50 sq ft × 3) |
| 4 persons | ≥ 200 sq ft (50 sq ft × 4) |
| 5 persons | ≥ 250 sq ft (50 sq ft × 5) |

#### **Primary Authority — Documents to Insert**

* **Pittsburgh Zoning Code — Residential Use Regulations**
  [https://pittsburghpa.gov/dcp/zoning-code](https://pittsburghpa.gov/dcp/zoning-code)
  🖍 Highlight residential use classifications and any household-based occupancy standards.
* **Pittsburgh Property Maintenance Code (IPMC) — Occupancy Standards**
  [https://codes.iccsafe.org/content/IPMC2021P1/chapter-4-light-ventilation-and-occupancy-limitations](https://codes.iccsafe.org/content/IPMC2021P1/chapter-4-light-ventilation-and-occupancy-limitations#IPMC2021P1_Ch04)
  🖍 Highlight minimum space requirements per occupant and residential occupancy standards.

📍 **Purpose:** Establishes Pittsburgh''s occupancy limits and space standards governing shared residential dwellings.

### **3B. Zoning and Permitting Guidelines (Pittsburgh)**

Zoning and permitting requirements in Pittsburgh regulate **how a property may be used**, not whether residents are related. Residential zoning districts are intended for dwelling use and not for lodging, boarding, or institutional operations unless specifically permitted. Where a residence is used consistently with its residential zoning classification and occupancy limits, it remains a lawful residential use.

## **Primary Authority**

**City of Pittsburgh Zoning Code**

**Code Title:** Title 9, Zoning Code
**Governing Articles:**

* Chapter 903 — Residential Zoning Districts
* Chapter 911 — Primary Uses (Use Table)
* Chapter 926 — Definitions

**Official Source (Authoritative Link):**
[https://ecode360.com/45474054](https://ecode360.com/45474054)

## **Applicable Residential Zoning Framework**

The City of Pittsburgh regulates residential land use through its Title 9 Zoning Code. Residential occupancy is governed by **use classification and zoning district**, not by internal household arrangements, provided the use does not meet the definition of a regulated institutional, commercial, or licensed facility.

Shared or independent living arrangements that function as residential households are evaluated under the same zoning standards as other residential dwelling units.

## **§ 911.02 — Residential Use Table (Relevant Rows)**

The following residential use classifications are permitted within Pittsburgh zoning districts pursuant to § 911.02:

| Residential Use Classification | Typical Zoning Districts | Zoning Status |
| ----- | ----- | ----- |
| Single-Unit Detached Residential | R1D (R1D-VL, R1D-L, R1D-M, R1D-H) | Permitted by Right |
| Single-Unit Attached Residential | R1A (R1A-V, R1A-H) | Permitted by Right |
| Two-Unit Residential (Duplex) | R2 | Permitted by Right |
| Three-Unit Residential (Triplex) | R3 | Permitted by Right |
| Multi-Unit Residential (4+ units) | RM (RM-M, RM-H) | Permitted by Right |

Residential uses not listed above may be subject to conditional use approval or additional review depending on zoning district and use intensity.

## **Chapter 903 — Residential Zoning Districts**

Chapter 903 establishes residential zoning districts and authorizes dwelling units intended for long-term residential occupancy. These districts permit households to occupy dwelling units in accordance with the use classifications identified in § 911.02.

Nothing in Chapter 903 prohibits shared household living arrangements, provided the use remains residential in nature and does not introduce commercial, institutional, or licensed service operations.

## **Chapter 926 — Definitions Cross-Walk**

The following definitions control interpretation of residential use under the Zoning Code:

**Dwelling Unit**
A building or portion thereof designed for occupancy by one household, providing complete and independent living facilities for living, sleeping, eating, cooking, and sanitation.

**Family**
One or more persons occupying a dwelling unit and living together as a single housekeeping unit, including up to three unrelated persons, as permitted by zoning.

**Residential Use**
Use of a property for living purposes within a dwelling unit, classified by unit count and building type under § 911.02.

These definitions confirm that zoning compliance is determined by **use classification and household structure**, not by private cost-sharing agreements or internal living arrangements.

## **Zoning and Permitting Conclusion**

Residential shared or independent living arrangements that comply with the above zoning classifications and definitions are permitted residential uses under the City of Pittsburgh Zoning Code. No special zoning permit is required where the use remains within a permitted residential classification and does not constitute a licensed, institutional, or commercial operation.

📍 **Purpose:** Confirms that the shared-housing model aligns with Pittsburgh''s residential zoning framework.

## **Section 4 — Fair Housing Act Summary & ADA Guidance (If Applicable)**

### **4A. Fair Housing Act Summary**

Housing in Pittsburgh is subject to federal, state, and local fair-housing laws. The **Federal Fair Housing Act** prohibits discrimination in housing based on race, color, religion, sex, national origin, familial status, and disability. The **Pennsylvania Human Relations Act** and the **Pittsburgh City Code** provide additional protections, including sexual orientation, gender identity, source of income, and marital status. These laws regulate access to housing and treatment of residents, regardless of housing type or licensing status.

#### **Primary Authority — Documents to Insert**

* **HUD Fair Housing Act Overview**
  [https://www.hud.gov/helping-americans/fair-housing-act-overview](https://www.hud.gov/helping-americans/fair-housing-act-overview)
  🖍 Highlight protected classes and prohibition of housing discrimination.
* **Pittsburgh City Code — Fair Housing Protections**
  [https://drive.google.com/file/d/13xp4B120e0iCr4TJnivj02qmpOBmYbsw/view?usp=sharing](https://drive.google.com/file/d/13xp4B120e0iCr4TJnivj02qmpOBmYbsw/view?usp=sharing)
  🖍 Highlight local protected classes and enforcement authority.

📍 **Purpose:** Demonstrates compliance with federal, state, and local fair-housing requirements applicable to shared housing.

### **4B. ADA Guidance (If Applicable)**

The **Americans with Disabilities Act (ADA)** applies to public accommodations and commercial facilities open to the public. Private residential housing, including independent shared housing, is not considered a public accommodation under ADA Title III. Disability-related housing obligations arise under fair-housing laws rather than the ADA. Housing providers must consider reasonable accommodations when requested by a resident with a disability, provided such accommodations do not impose an undue burden or fundamentally alter the housing arrangement.

#### **Primary Authority — Documents to Insert**

* **ADA Title III — Public Accommodations**
  [https://www.ada.gov/topics/title-iii/](https://www.ada.gov/topics/title-iii/)
  🖍 Highlight definition of public accommodations and exclusion of private residences.
* **HUD Guidance — Reasonable Accommodations and Modifications**
  [https://www.hud.gov/program_offices/fair_housing_equal_opp/reasonable_accommodations_and_modifications](https://www.hud.gov/program_offices/fair_housing_equal_opp/reasonable_accommodations_and_modifications)
  🖍 Highlight reasonable accommodation standards for housing.

📍 **Purpose:** Clarifies ADA applicability and confirms disability-related obligations under fair-housing law.',
  2850,
  '[
    {"id": "section-1", "title": "Section 1 — Introduction, Usage, Language Guidelines & Housing Model Overview", "level": 2},
    {"id": "section-1a", "title": "1A. Purpose and Use of the Binder", "level": 3},
    {"id": "section-1b", "title": "1B. Housing Model Overview", "level": 3},
    {"id": "section-1c", "title": "1C. Language and Operations Guardrails", "level": 3},
    {"id": "section-2", "title": "Section 2 — Definitions of Licensed vs. Unlicensed Facilities", "level": 2},
    {"id": "section-2a", "title": "2A. Licensed vs. Unlicensed Facility Definitions (Pennsylvania)", "level": 3},
    {"id": "section-2b", "title": "2B. Distinction from Rooming and Boarding Houses (Pittsburgh)", "level": 3},
    {"id": "section-3", "title": "Section 3 — City & County Zoning and Permitting Guidelines", "level": 2},
    {"id": "section-3a", "title": "3A. State and Local Occupancy Rules (Pittsburgh)", "level": 3},
    {"id": "section-3b", "title": "3B. Zoning and Permitting Guidelines (Pittsburgh)", "level": 3},
    {"id": "section-4", "title": "Section 4 — Fair Housing Act Summary & ADA Guidance", "level": 2},
    {"id": "section-4a", "title": "4A. Fair Housing Act Summary", "level": 3},
    {"id": "section-4b", "title": "4B. ADA Guidance (If Applicable)", "level": 3}
  ]'::jsonb,
  '{"source": "manual_import", "version": "1.0", "imported_at": "2026-01-24"}'::jsonb
)
ON CONFLICT (location_name, state_code) DO UPDATE SET
  content = EXCLUDED.content,
  word_count = EXCLUDED.word_count,
  section_headers = EXCLUDED.section_headers,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- 2. LINDEN, NEW JERSEY (CITY)
-- ============================================================================

INSERT INTO public.local_compliance_binders (
  location_name,
  location_type,
  state_code,
  title,
  content,
  word_count,
  section_headers,
  metadata
) VALUES (
  'Linden',
  'city',
  'NJ',
  'Linden, NJ Compliance Binder: Independent Shared Housing',
  E'# **Linden, NJ Compliance Binder: Independent Shared Housing**

## **Highlight Instructions**

**For each document referenced in this binder, highlight the following parts when reviewing or printing the full documents:**

**These highlight instructions provide the specific sentences or sections to mark in the original documents so that a printed binder will clearly emphasize the key points supporting the shared housing model.**

# **Section 1 — Introduction, Usage, Language Guidelines & Housing Model Overview**

### **1A. Purpose and Use of the Binder**

This compliance binder consolidates applicable federal, state, and local regulatory references demonstrating that the residence operates as **independent shared housing**. The materials contained herein establish that the housing model provides **housing only** and does not include supervision, personal care, case management, or coordinated services. As such, the residence does not fall within classifications requiring licensure as an assisted living residence, adult care facility, or rooming or boarding house. The binder is maintained as a centralized reference to document regulatory alignment and to provide clarity regarding the legal framework governing shared housing in Linden, New Jersey. It reflects current statutes, administrative codes, and municipal regulations relevant to residential occupancy, zoning, and fair housing. The binder remains available in the event of inquiries from municipal officials, inspectors, or other stakeholders seeking to understand the nature and classification of the housing model.

📍 Purpose: Establishes why this binder exists and documents its role as a reference demonstrating regulatory alignment for an independent shared housing model.

### **1B. Housing Model Overview**

The residence operates as **independent shared housing**, defined as a private residential dwelling occupied by unrelated adults who share common living spaces. The housing arrangement provides shelter only; residents independently manage their own daily activities, meals, personal care, transportation, and any services they may choose to obtain on their own. No services are provided, arranged, coordinated, or overseen by the operator or landlord. There is no on‑site staff, supervision, monitoring, or case management. The residence is leased under standard residential lease terms and is not operated as a congregate living facility, care setting, or lodging establishment. The housing is not marketed or represented as assisted living, supportive housing, or any form of residential care. This housing model is intentionally structured to remain within the scope of **unlicensed residential use** under New Jersey law.

📍 Purpose: Describes the shared housing model in factual terms to clearly distinguish it from licensed or service-based residential settings.

### **1C. Language and Operations Guardrails**

Consistent terminology and operations are used to reflect the residence''s classification as independent shared housing within a standard residential dwelling. All written, verbal, and marketing descriptions use neutral residential language such as shared housing, shared household, housemates, or independent housing. Terminology that implies services, supervision, institutional use, or lodging operations, including group home, assisted living, supportive housing, boarding house, rooming house, or care residence, is not used.

Occupancy is documented at the household level through a single shared household occupancy agreement executed by all occupants. The agreement reflects shared use of the dwelling as a whole and shared access to common living areas. It does not assign individual rooms, grant exclusive possession of sleeping areas, or establish room-based tenancy or lodging arrangements.

The residence provides housing only. No services are provided, arranged, coordinated, or overseen by the owner, leaseholder, or any other party. There is no on-site staff, supervision, monitoring, personal care, medication assistance, case management, or structured programming. Any household guidelines are limited to ordinary residential expectations related to safety, cleanliness, quiet enjoyment, and shared use of space and are consistent with typical private household living.

These language and operational guardrails ensure that the residence functions as independent shared housing and remains within the scope of unlicensed residential use under applicable New Jersey and municipal regulations.

📍 Purpose: Prevents accidental misclassification by aligning language and operations with a housing-only, unlicensed residential model.

# **Section 2 — Definitions of Licensed vs. Unlicensed Facilities & Distinction from Rooming and Boarding Houses**

### **2A. Licensed vs. Unlicensed Facility Definitions (New Jersey)**

In New Jersey, residential settings are subject to state licensure **only when housing is combined with the provision, arrangement, or coordination of services**. Assisted living residences and comprehensive personal care homes are licensed and regulated by the New Jersey Department of Health under Title 8 of the New Jersey Administrative Code. Under N.J.A.C. 8:36, an **assisted living residence** and a **comprehensive personal care home** are defined as residential facilities that provide apartment‑style housing **and ensure that assisted living services are available when needed**. These facilities serve **four or more adult persons unrelated to the proprietor** and operate under an organized program of care. The regulatory trigger for licensure is the **availability and coordination of services**, not the mere presence of unrelated adults living together. Independent shared housing, where **only shelter is provided** and no personal care, supervision, medication management, case management, or coordinated services are offered or arranged, does **not** meet the statutory or regulatory definitions requiring licensure by the New Jersey Department of Health.

**Primary authority – documents to insert**

* **N.J.A.C. 8:36‑1.3 – Definitions**
  [New Jersey Administrative Code § 8:36‑1.3](https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-8-36-1-3)
  🖍 Highlight the definitions of "Assisted living residence" and "Comprehensive personal care home" and the language stating that these facilities ensure that assisted living services are available when needed and serve four or more adults unrelated to the proprietor.
* **N.J.A.C. 8:36‑1.2 – Scope**
  [New Jersey Administrative Code § 8:36‑1.2](https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-8-36-1-2)
  🖍 Highlight the language describing the scope of facilities regulated under assisted living rules and references to the provision or coordination of care or services.

📍 Purpose: Establishes the service‑based threshold for licensure in New Jersey and confirms that housing‑only shared living does not require Department of Health licensure.

### **2B. Distinction from Rooming and Boarding Houses (New Jersey)**

New Jersey separately regulates **rooming and boarding houses** under the Rooming and Boarding House Act, administered by the New Jersey Department of Community Affairs. These establishments are subject to licensure, inspection, and operational oversight distinct from both standard residential housing and assisted living facilities. Under N.J.S.A. 55:13B, a **boarding house** is defined as a building containing two or more units of dwelling space where **personal or financial services are provided** to residents. A **rooming house** is defined as a boarding house in which personal or financial services are not provided, but where **individual rooms are rented**. Both classifications require licensure through the Department of Community Affairs and are subject to inspections and ongoing evaluations for resident safety and compliance with building and fire codes. Independent shared housing does not fall within these classifications. The residence is not operated as a lodging establishment, does not rent individual rooms under rooming arrangements, does not provide meals or services, and is not licensed as a rooming or boarding house. Occupants share the dwelling as a single household under standard residential lease terms.

**Primary authority – documents to insert**

* **N.J.S.A. 55:13B‑3 – Definitions**
  [New Jersey Statutes Annotated § 55:13B‑3](https://law.justia.com/codes/new-jersey/title-55/section-55-13b-3/)
  🖍 Highlight the definitions of "Boarding house," "Rooming house," and "Personal services," which distinguish boarding and rooming houses by the provision of services and the rental of individual rooms.
* **New Jersey Department of Community Affairs – Bureau of Rooming and Boarding House Standards**
  [Rooming and Boarding House Standards – NJ DCA](https://www.nj.gov/dca/divisions/codes/offices/roomingboarding.shtml)
  🖍 Highlight the language stating that owners and operators must apply for a license to operate a rooming or boarding house and that such houses are subject to inspections and evaluations for resident safety.

📍 Purpose: Differentiates shared housing from regulated rooming and boarding houses by clarifying statutory definitions, licensing requirements, and operational characteristics under New Jersey law.

# **Section 3 — City & County Zoning and Permitting Guidelines (Linden, New Jersey)**

### **3A. State and Local Occupancy Rules (Linden, NJ)**

Residential occupancy in Linden, New Jersey is governed by municipal zoning and housing codes that define who may occupy a dwelling unit and under what conditions. These rules focus on **household composition** and **minimum space requirements**, rather than on the provision of services. Occupancy limits are applied to ensure dwellings remain residential in character and are not converted into lodging or institutional uses. Under Linden''s municipal code, single‑family dwellings are intended to be occupied by a family unit, with limited allowance for unrelated persons. These provisions regulate **how many unrelated individuals may reside together** and establish minimum square‑footage standards per occupant. Compliance with these rules supports the classification of the residence as a standard residential dwelling rather than a rooming or boarding house.

**Primary authority – documents to insert**

* **Linden Housing Code – Minimum Space, Use and Egress Requirements**
  [City of Linden Code – Minimum Space and Use](https://library.municode.com/nj/linden/codes/code_of_ordinances?nodeId=PTIIRECO_CH31ZO_ARTVIIMISPUSERE_S31-18OCPASP)
  🖍 Highlight the provision stating that a single‑family dwelling may be occupied by persons comprising a family and **no more than two other persons**.
* **Linden Housing Code – Required Space in Dwelling Units**
  (Contained within the same chapter of the code)
  🖍 Highlight the minimum square‑footage requirements for sleeping rooms, such as **70 square feet for the first occupant and an additional 50 square feet for each additional occupant**.

📍 Purpose: Establishes Linden''s local occupancy limits and space standards, demonstrating how unrelated persons may lawfully share a residential dwelling.

### **3B. Zoning and Permitting Guidelines (Linden, NJ)**

Zoning and permitting requirements in Linden regulate **how a property may be used**, rather than who occupies it. The permitted use of a residential property is determined by its zoning designation and any issued certificates or approvals. Residential zoning districts are intended for dwelling use, not for lodging, boarding, or institutional operations. The classification of a dwelling as a single‑family or two‑family residence determines allowable occupancy and use. Converting a residence into a rooming or boarding house would require a different classification and compliance with separate licensing and inspection regimes. Where a residence is used consistently with its zoning designation and occupancy limits, it remains a lawful residential use.

**Primary authority – documents to insert**

* **Linden Ordinance – Definition of "Household"**
  [Ordinance to Amend and Supplement Chapter XXXI](https://linden-nj.gov/wp-content/uploads/2016/10/Zoning-Ordinance-Amendment-31.pdf)
  🖍 Highlight the definition of "Household," describing a family living together in a single dwelling unit with common access to all living and eating areas and areas for food preparation.
* **Linden Zoning Code – Permitted Residential Uses**
  [Linden Code of Ordinances](https://library.municode.com/nj/linden/codes/code_of_ordinances)
  🖍 Highlight the sections identifying permitted residential uses in single‑family zoning districts and the absence of lodging, boarding, or institutional use within residential zoning classifications.

📍 Purpose: Confirms that the shared housing model aligns with Linden''s residential zoning and permitting framework and does not constitute a lodging, boarding, or institutional use.

# **Section 4 — Fair Housing Act Summary & ADA Guidance (If Applicable)**

### **4A. Fair Housing Act Summary**

Housing in Linden, New Jersey is subject to federal and state fair housing laws that prohibit discrimination in residential housing. These laws apply to shared housing arrangements and govern how housing is offered, leased, and occupied. The **Federal Fair Housing Act** prohibits discrimination in housing based on **race, color, religion, sex, national origin, familial status, and disability**. The **New Jersey Law Against Discrimination (NJLAD)** provides broader protections, including protection against discrimination based on **lawful source of income, sexual orientation, gender identity or expression, marital status, domestic partnership status, and other protected characteristics**. These laws regulate **housing access and treatment**, not housing type. Independent shared housing must therefore be operated in a manner that is non‑discriminatory and consistent with these protections.

**Primary authority – documents to insert**

* **HUD Fair Housing Act Overview**
  [HUD – Fair Housing Act Overview](https://www.hud.gov/helping-americans/fair-housing-act-overview)
  🖍 Highlight the list of protected classes (race, color, religion, sex, national origin, familial status, disability) and the statement that the Act prohibits discrimination in housing.
* **New Jersey Law Against Discrimination – Housing Protections**
  [New Jersey Division on Civil Rights](https://www.njoag.gov/about/divisions-and-offices/division-on-civil-rights-home/)
  🖍 Highlight the expanded list of protected classes under NJLAD, including lawful source of income, sexual orientation, gender identity or expression, marital status, and domestic partnership status, and any language stating that discrimination in housing is prohibited.

📍 Purpose: Demonstrates compliance with federal and New Jersey fair housing laws applicable to shared residential housing.

### **4B. ADA Guidance (If Applicable)**

The **Americans with Disabilities Act (ADA)** applies primarily to public accommodations and commercial facilities that are open to the public. Private residential housing, including independent shared housing, is **not considered a public accommodation** under ADA Title III. While ADA public-accommodation standards do not apply to private residences, disability‑related housing obligations arise under **fair housing laws**, not the ADA. Under the Fair Housing Act and NJLAD, housing providers must consider **reasonable accommodations** or **reasonable modifications** when requested by a resident with a disability, provided such accommodations do not impose an undue burden or fundamentally alter the housing arrangement. Understanding this distinction prevents misapplication of ADA standards to private housing while ensuring that disability-related housing rights are respected.

**Primary authority – documents to insert**

* **ADA Title III – Public Accommodations**
  [ADA.gov – Title III](https://www.ada.gov/topics/title-iii/)
  🖍 Highlight the definition of public accommodations, examples showing that Title III applies to businesses and facilities open to the public, and the absence of private residential housing from the definition.
* **HUD Guidance – Reasonable Accommodations and Modifications**
  [HUD – Reasonable Accommodations and Modifications](https://www.hud.gov/program_offices/fair_housing_equal_opp/reasonable_accommodations_and_modifications)
  🖍 Highlight the explanation of reasonable accommodations in housing and the distinction between housing obligations and ADA public-access standards.

📍 Purpose: Clarifies the limited applicability of ADA public-accommodation standards to private shared housing while confirming disability-related obligations under fair housing law.',
  2650,
  '[
    {"id": "section-1", "title": "Section 1 — Introduction, Usage, Language Guidelines & Housing Model Overview", "level": 2},
    {"id": "section-1a", "title": "1A. Purpose and Use of the Binder", "level": 3},
    {"id": "section-1b", "title": "1B. Housing Model Overview", "level": 3},
    {"id": "section-1c", "title": "1C. Language and Operations Guardrails", "level": 3},
    {"id": "section-2", "title": "Section 2 — Definitions of Licensed vs. Unlicensed Facilities", "level": 2},
    {"id": "section-2a", "title": "2A. Licensed vs. Unlicensed Facility Definitions (New Jersey)", "level": 3},
    {"id": "section-2b", "title": "2B. Distinction from Rooming and Boarding Houses (New Jersey)", "level": 3},
    {"id": "section-3", "title": "Section 3 — City & County Zoning and Permitting Guidelines", "level": 2},
    {"id": "section-3a", "title": "3A. State and Local Occupancy Rules (Linden, NJ)", "level": 3},
    {"id": "section-3b", "title": "3B. Zoning and Permitting Guidelines (Linden, NJ)", "level": 3},
    {"id": "section-4", "title": "Section 4 — Fair Housing Act Summary & ADA Guidance", "level": 2},
    {"id": "section-4a", "title": "4A. Fair Housing Act Summary", "level": 3},
    {"id": "section-4b", "title": "4B. ADA Guidance (If Applicable)", "level": 3}
  ]'::jsonb,
  '{"source": "manual_import", "version": "1.0", "imported_at": "2026-01-24"}'::jsonb
)
ON CONFLICT (location_name, state_code) DO UPDATE SET
  content = EXCLUDED.content,
  word_count = EXCLUDED.word_count,
  section_headers = EXCLUDED.section_headers,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- 3. QUEENS COUNTY, NEW YORK (COUNTY)
-- ============================================================================

INSERT INTO public.local_compliance_binders (
  location_name,
  location_type,
  state_code,
  title,
  content,
  word_count,
  section_headers,
  metadata
) VALUES (
  'Queens County',
  'county',
  'NY',
  'Compliance Binder: Independent Shared Housing, Queens County, NY',
  E'# **Compliance Binder: Independent Shared Housing, Queens County, NY**

## **Highlight Instructions**

**For each document referenced in this binder, highlight the following parts when reviewing or printing the full documents:**

**These highlight instructions provide the specific sentences or sections to mark in the original documents so that a printed binder will clearly emphasize the key points supporting the shared housing model.**

# **Section 1: Introduction, Usage, Language Guidelines & Housing Model Overview**

## **1A. PURPOSE & USE OF THIS BINDER**

This binder exists to provide a clear and organized reference for an independent shared‑housing model. It assembles the relevant state, city, and federal documents and explanations that demonstrate the residence is purely shared housing, providing shelter but no services, and therefore does not fall under adult‑care, assisted‑living, or rooming‑house regulations. By consolidating all of the key definitions, regulations, and guidelines in one place, this binder makes it easy to verify compliance with laws and answer any questions from officials or stakeholders.

## **1B. HOUSING MODEL OVERVIEW**

Finally, the housing model itself is described here: unrelated adults live together in one residence, sharing common spaces. The arrangement provides shelter only. Residents handle their own daily activities, meals, personal care, and transportation. There is no on‑site staff, supervision, or case management. The property is marketed simply as shared housing, and all residents are tenants under a standard lease. This description ensures the model is clearly identified as unlicensed and non‑institutional.

📌 Purpose: Establishes **what the model is**, before regulators assume what it is not. Describes the housing-only model so readers understand the operation and do not misclassify it

## **1C. LANGUAGE & OPERATIONS GUARDRAILS**

This section also sets out preferred terminology and operational guidelines. The residence is always described using phrases like "shared housing," "independent housing," and "housemates." Terms implying care or supervision such as "group home," "assisted living," "supportive housing," or "boarding house",are not used. There are no personal care services, no supervision, no meals, and no transportation provided or coordinated. Lease agreements are standard residential leases, and residents share the dwelling as a single household.

📌 Purpose: Prevents accidental misclassification through language.

📌 Purpose: Combines the overall reason for the binder, explains how it should be used, provides language guidance, and describes the shared‑housing model so that the residence is consistently understood as unlicensed, independent housing.

# **Section 2: Definitions of Licensed vs. Unlicensed Facilities & Distinction from Rooming/Boarding Houses**

This section presents the regulatory definitions that distinguish unlicensed shared housing from licensed facilities and from rooming or boarding houses. Under New York State Department of Health rules, facilities must be licensed when they provide, arrange, or coordinate long‑term care services such as personal care, supervision, medication management, or case management. Independent housing that offers only shelter and no services is explicitly described by the Department as not licensed or regulated. This principle is supported by regulatory definitions in Title 18 NYCRR § 485.2 and Title 10 NYCRR § 1001.2, which define adult‑care facilities and assisted‑living residences based on the presence of services and monitoring.

By contrast, rooming or boarding houses in New York City are Class B multiple dwellings that rent individual rooms separately and often provide meals or other services. They require a specific Certificate of Occupancy, annual registration, and compliance with additional fire‑safety and structural standards. The shared‑housing model described in this binder is not a rooming or boarding house, because it does not rent individual rooms under separate leases, does not provide meals or supervision, and is not classified as a Class B dwelling.

📌 Purpose: Provides authoritative definitions that demonstrate why the residence is unlicensed shared housing and clearly distinguishes it from both licensed care facilities and regulated rooming/boarding houses.

## **2A. LICENSED VS UNLICENSED FACILITY DEFINITIONS**

The New York State Department of Health letter dated April 25, 2016 clarifies that independent living settings that do not provide, arrange, or coordinate services are **not licensed or regulated** by the Department. Licensure applies only when services such as personal care or supervision are provided.

* **Document:** NYSDOH letter (April 25, 2016) – highlight the sentence "Independent living is not licensed or regulated by the Department" and the section stating that licensure applies when services are provided, arranged or coordinated.
* **Document:** 18 NYCRR § 485.2 – Adult Care Facility definitions ([link](https://www.law.cornell.edu/regulations/new-york/18-NYCRR-485.2)) – highlight the definition of an adult care facility as providing room, board, and personal care or supervision to adults unable to live independently.
* **Document:** 10 NYCRR § 1001.2 – Assisted Living Residence definitions ([link](https://www.law.cornell.edu/regulations/new-york/10-NYCRR-1001.2)) – highlight the definition that an assisted living residence provides or arranges housing, on-site monitoring, and personal care services for five or more unrelated adults.

### **🖍 Highlight**

* Service-based licensing language
  **NYSDOH letter (April 25, 2016): Page 1 – highlight the sentence stating "Independent living is not licensed or regulated by the Department." Page 3 – highlight the section explaining that licensure applies only when a setting provides, arranges or coordinates services.**
* **18 NYCRR § 485.2: Highlight the definition of an adult care facility as providing room, board and personal care or supervision to adults unable to live independently.**
* **10 NYCRR § 1001.2: Highlight the definition that an assisted living residence provides or arranges housing, on‑site monitoring, and personal care services for five or more unrelated adults.**

📌 Purpose
 Proves the residence does **not** meet licensure thresholds.

## **2B. DISTINCTION FROM ROOMING / BOARDING HOUSES**

Rooming and boarding houses are classified as Class B multiple dwellings in NYC and are characterized by individual room rentals and lodging. The housing model described in this binder is a single household occupied by unrelated adults under one lease, and does not meet the criteria for a rooming or boarding house.

* **Document:** NYC Housing Maintenance Code ([link](https://www.nyc.gov/assets/buildings/pdf/HousingMaintenanceCode.pdf)) – highlight definitions of "rooming house" and references to Class B dwellings.

### **🖍 What to Highlight**

* Class B requirement

* Individual room tenancy characteristics
  **NYC Housing Maintenance Code – rooming house definitions: Highlight the definitions of "rooming house" and references to Class B dwellings.**

📌 Purpose
 Demonstrates the residence **does not fall within** rooming or boarding house classifications.

# **Section 3: City & County Zoning and Permitting Guidelines**

The zoning and permitting framework in Queens County (New York City) regulates how properties may be used. This section explains that the Certificate of Occupancy (CO) issued by the NYC Department of Buildings governs the legal use and occupancy limits of each building. A residential property with a CO designating it as a one‑family or two‑family dwelling must remain in that use; converting it to a lodging or rooming house would require a different classification and likely violate zoning. The NYC Zoning Resolution defines a "family" as either related individuals or no more than three unrelated persons living together as a single household. By operating within these definitions—sharing a home without subdividing or adding individual room rentals—this residence remains in compliance with zoning regulations. Whenever questions arise, the property''s CO and the relevant zoning excerpts can be referenced to show that the current use aligns with permitted residential occupancy.

📌 Purpose: Aligns the shared‑housing model with local zoning requirements, ensuring the property''s legal use and occupancy limits are respected.

## **3A. STATE & LOCAL OCCUPANCY RULES**

The NYC Zoning Resolution defines a "family" as persons related by blood, marriage, or adoption, **or no more than three unrelated persons living together as a single household**. This definition establishes that up to three unrelated adults may share a dwelling in a residential district.

* **Document:** NYC Zoning Resolution, Article I Chapter 2 – Use Regulations ([link](https://zr.planning.nyc.gov/article-i/chapter-2)) – highlight the definition of *Family*.
* **Document:** NYC Housing Maintenance Code ([link](https://www.nyc.gov/assets/buildings/pdf/HousingMaintenanceCode.pdf)) – use search to find the line referencing "not more than three unrelated persons".

### **🖍 What to Highlight**

* "Family" definition allowing up to three unrelated persons

* Residential occupancy framework

* No reference to care, services, or licensure
  **NYC Zoning Resolution: In Article I, Chapter 2, highlight the definition of *Family*, which notes that a family may consist of persons related by blood, marriage or adoption, or no more than three unrelated persons living together as a single household.**
* **NYC Housing Maintenance Code: Highlight the line referencing that a dwelling may not house more than three unrelated persons.**

📌 Purpose
 Shows the model fits within **residential occupancy standards**, not institutional use.

## **3B. ZONING & PERMITTING GUIDELINES (QUEENS, NYC)**

* **Document:** NYC Department of Buildings – Certificate of Occupancy instructions ([link](https://www.nyc.gov/site/buildings/property-or-business-owner/certificate-of-occupancy.page)) – highlight instructions for obtaining a Certificate of Occupancy.
* **Document:** NYC Department of City Planning – Zoning District Tools ([link](https://www.nyc.gov/site/planning/zoning/districts-tools.page)) – highlight the sec.

### **🖍 What to Highlight**

* Residential use classification

* Absence of Class B or lodging designation

* Dwelling type
  **NYC Department of City Planning – Zoning District Tools: Highlight the notes directing users to official zoning maps and tools.**


📌 Purpose
 Anchors the model as **residential use**, not community facility or lodging.

# Section 4: Fair Housing Act Summary & ADA Guidance (If Applicable)

This section outlines the key protections of the federal Fair Housing Act and corresponding New York laws. The Fair Housing Act prohibits discrimination in housing on the basis of race, color, religion, sex, disability, familial status, and national origin. New York City and State laws expand these protections to include source of income, sexual orientation, gender identity, and other characteristics. By understanding and following these protections, housing providers ensure that prospective and current tenants are treated equitably, screening criteria are applied consistently, and reasonable accommodations are considered when requested.

With respect to the ADA, Title III applies to public accommodations—businesses and facilities open to the public—not to private residences. Private shared housing is therefore not subject to ADA public‑accommodation requirements such as accessible bathrooms or signage. However, fair‑housing law does require reasonable accommodations in housing when needed by individuals with disabilities. For example, allowing a tenant to install an accessibility ramp at their own expense may be considered a reasonable accommodation. This section helps clarify when these laws apply and ensures the shared‑housing model remains inclusive without introducing services or obligations that would change its unlicensed status.

📌 Purpose: Summarizes fair‑housing protections and clarifies that ADA public‑accommodation rules do not apply to private shared housing, while still acknowledging reasonable‑accommodation obligations under fair‑housing law.

## **4A. FAIR HOUSING ACT SUMMARY**

Federal and local fair housing laws prohibit discrimination in housing on the basis of protected classes such as race, color, national origin, religion, sex, familial status, and disability.

* **Document:** HUD Fair Housing Act overview ([link](https://www.hud.gov/helping-americans/fair-housing-act-overview)) – highlight the list of protected classes.
* **Document:** US Department of Justice Fair Housing page ([link](https://www.justice.gov/crt/fair-housing-act-1)) – highlight the paragraph describing prohibited discrimination by housing providers.
* **Document:** NYC Commission on Human Rights – Source of Income Protections ([link](https://www.nyc.gov/site/cchr/media/source-of-income.page)) – highlight the statement that discrimination based on lawful source of income is illegal.

### **🖍 What to Highlight**

* Protected classes

* Disability and familial status protections

* Source of income protections (NYC)
* **HUD Fair Housing Act overview: Highlight the list of protected classes (race, color, national origin, religion, sex, familial status and disability).**
* **US Department of Justice Fair Housing page: Highlight the paragraph describing prohibited discrimination by housing providers.**
* **NYC Commission on Human Rights – Source of Income page: Highlight the statement that discrimination based on lawful source of income is illegal.**

📌 Purpose
 Demonstrates non-discriminatory housing operations.

## **4B. ADA GUIDANCE (IF APPLICABLE)**

The ADA applies to public accommodations and commercial facilities; private residential housing is generally not a public accommodation. Housing providers should instead refer to fair housing reasonable accommodation requirements.

* **Document:** ADA Title III Overview ([link](https://www.ada.gov/topics/title-iii/)) – highlight that Title III applies to businesses open to the public.
* **Document:** NYS Homes and Community Renewal – Fair Housing Information ([link](https://hcr.ny.gov/fair-housing-information)) – highlight the explanation of reasonable accommodations in housing.

### **🖍 What to Highlight**

* ADA applies to public accommodations

* Private residential housing is not a public accommodation

* Reasonable accommodation applies under Fair Housing law
  **NYS Homes and Community Renewal – Fair Housing Information: Highlight the explanation of reasonable accommodations in housing.**
* **NYC Department of Buildings – Certificate of Occupancy instructions: Highlight the instructions for obtaining a Certificate of Occupancy.**

📌 Purpose
 Clarifies **scope**, prevents misapplication of ADA standards.',
  2200,
  '[
    {"id": "section-1", "title": "Section 1: Introduction, Usage, Language Guidelines & Housing Model Overview", "level": 2},
    {"id": "section-1a", "title": "1A. PURPOSE & USE OF THIS BINDER", "level": 3},
    {"id": "section-1b", "title": "1B. HOUSING MODEL OVERVIEW", "level": 3},
    {"id": "section-1c", "title": "1C. LANGUAGE & OPERATIONS GUARDRAILS", "level": 3},
    {"id": "section-2", "title": "Section 2: Definitions of Licensed vs. Unlicensed Facilities", "level": 2},
    {"id": "section-2a", "title": "2A. LICENSED VS UNLICENSED FACILITY DEFINITIONS", "level": 3},
    {"id": "section-2b", "title": "2B. DISTINCTION FROM ROOMING / BOARDING HOUSES", "level": 3},
    {"id": "section-3", "title": "Section 3: City & County Zoning and Permitting Guidelines", "level": 2},
    {"id": "section-3a", "title": "3A. STATE & LOCAL OCCUPANCY RULES", "level": 3},
    {"id": "section-3b", "title": "3B. ZONING & PERMITTING GUIDELINES (QUEENS, NYC)", "level": 3},
    {"id": "section-4", "title": "Section 4: Fair Housing Act Summary & ADA Guidance", "level": 2},
    {"id": "section-4a", "title": "4A. FAIR HOUSING ACT SUMMARY", "level": 3},
    {"id": "section-4b", "title": "4B. ADA GUIDANCE (IF APPLICABLE)", "level": 3}
  ]'::jsonb,
  '{"source": "manual_import", "version": "1.0", "imported_at": "2026-01-24"}'::jsonb
)
ON CONFLICT (location_name, state_code) DO UPDATE SET
  content = EXCLUDED.content,
  word_count = EXCLUDED.word_count,
  section_headers = EXCLUDED.section_headers,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after migration to confirm all 3 binders were inserted:
--
-- SELECT location_name, location_type, state_code, word_count
-- FROM public.local_compliance_binders
-- ORDER BY location_name;
--
-- Expected output:
-- | location_name  | location_type | state_code | word_count |
-- |----------------|---------------|------------|------------|
-- | Linden         | city          | NJ         | 2650       |
-- | Pittsburgh     | city          | PA         | 2850       |
-- | Queens County  | county        | NY         | 2200       |
-- ============================================================================
