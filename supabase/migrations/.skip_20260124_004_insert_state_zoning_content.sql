-- ============================================================================
-- MIGRATION: Insert State Zoning Content into state_compliance_binders
-- ============================================================================
-- Purpose: Populate zoning_content, zoning_section_headers, zoning_word_count
--          for 6 states: CA, FL, GA, NC, SC, TX
--
-- Source: Manually-created zoning & occupancy framework documents
-- ============================================================================

-- ============================================================================
-- 1. CALIFORNIA (CA)
-- ============================================================================
UPDATE public.state_compliance_binders
SET
  zoning_content = '# **California Compliance Binder, Zoning & Occupancy Framework, Shared Housing**

## **Section 3, State and Local Zoning and Occupancy Guidelines, California**

## **3A. State Zoning Authority, California**

Land use and zoning authority in California is governed by the California Government Code zoning statutes. Under this statutory framework, the State of California does **NOT** establish a single statewide definition of "family," "household," or a statewide numerical cap on unrelated persons living together in a dwelling. Zoning authority is delegated to **local governments**, which adopt and enforce their own zoning ordinances, land use codes, and occupancy definitions.

IS,
Zoning authority is local
Household and unrelated occupant limits are set by city or county ordinance

IS NOT,
A uniform statewide family definition
A statewide unrelated occupant cap

Primary authority,
California Government Code § 65800, zoning authority for cities and counties
[https://codes.findlaw.com/ca/government-code/gov-sect-65800/](https://codes.findlaw.com/ca/government-code/gov-sect-65800/)

Important statewide clarification (licensed only),
California Health and Safety Code § 1566.3 requires that a **licensed residential facility serving six or fewer persons** be treated as a residential use for zoning purposes
[https://codes.findlaw.com/ca/health-and-safety-code/hsc-sect-1566-3/](https://codes.findlaw.com/ca/health-and-safety-code/hsc-sect-1566-3/)

## **3B. Household, Boarding, Rooming, and Lodging Classifications, California**

California jurisdictions commonly regulate residential occupancy using zoning classifications such as,

Family or Household, Residential Use
Boardinghouse
Rooming House
Lodging House
Single Housekeeping Unit

These are **zoning classifications**, not licenses. A dwelling does **NOT** require state licensure unless regulated care, supervision, or treatment is provided and the use meets a licensed care category.

Key compliance rule for this model,

ACCEPTABLE,
Residential household by right, OR
Rooming, boarding, or lodging use allowed by permit, conditional use, or zoning approval
No care, supervision, or services provided
No state care or facility license required

NOT ACCEPTABLE,
Use restricted to commercial zoning only, AND
Requires care based licensing or institutional licensing, AND
Converts the dwelling into a regulated facility

## **3C. California Jurisdictions Where Housing 6 or More Individuals IS NOT ALLOWED, By Right**

### **1. City of San Luis Obispo, California**

IS,
Local standards limit unrelated occupancy to **no more than three unrelated persons** in a dwelling unit

IS NOT,
Housing for 6 unrelated adults by right

Primary authority,
City of San Luis Obispo City Clerk record referencing unrelated occupancy cap
[https://opengov.slocity.org/WebLink/DocView.aspx?dbid=0&id=51757&repo=CityClerk](https://opengov.slocity.org/WebLink/DocView.aspx?dbid=0&id=51757&repo=CityClerk)

Status, NOT ALLOWED by right

### **2. City of Blue Lake, California**

IS,
Family definition limits occupancy to **not more than five unrelated persons** living together as a single housekeeping unit

IS NOT,
Housing for 6 unrelated adults by right under the family definition

Primary authority,
City of Blue Lake Code of Ordinances, Family Definition
[https://ecode360.com/44212670](https://ecode360.com/44212670)

Status, NOT ALLOWED by right

### **3. City of Benicia, California**

IS,
Local constraints restrict room rentals and unrelated occupancy in dwelling units

IS NOT,
Housing for 6 unrelated adults through room rental without triggering non-residential or regulated use pathways

Primary authority,
City of Benicia Public Draft Constraints Document
[https://www.ci.benicia.ca.us/vertical/sites/%7BF991A639-AAED-4E1A-9735-86EA195E2C8D%7D/uploads/V._Public_Draft_Constraints.pdf](https://www.ci.benicia.ca.us/vertical/sites/%7BF991A639-AAED-4E1A-9735-86EA195E2C8D%7D/uploads/V._Public_Draft_Constraints.pdf)

Status, NOT ALLOWED by right

## **3D. California Jurisdictions Where Housing 6 or More Individuals IS ALLOWED, By Right or By Household Definition, Not Licensed**

### **1. City of Los Angeles, California, BY RIGHT HOUSEHOLD DEFINITION**

IS,
Family defined as one or more persons living together with common access to and use of living, kitchen, and eating areas
No numeric cap stated in the household definition itself
Occupancy governed by building and fire code limits, not unrelated status

IS NOT,
Automatically a boarding or commercial use solely because occupants are unrelated

Primary authority,
City of Los Angeles, Family Definition Reference (City Clerk document)
[https://cityclerk.lacity.org/onlinedocs/2014/14-0118_misc_3-5-14.pdf](https://cityclerk.lacity.org/onlinedocs/2014/14-0118_misc_3-5-14.pdf)

Status, ALLOWED by household definition, subject to building and fire code

### **2. Los Angeles County, California, Unincorporated Areas, BY RIGHT**

IS,
Family defined as one or more persons living together, **related or unrelated**, as a single household
No unrelated numeric cap in the definition itself

IS NOT,
Automatically a boarding or commercial use solely because occupants are unrelated

Primary authority,
Los Angeles County Code, Housing Definitions, Family Definition
[https://library.municode.com/ca/los_angeles_county/codes/code_of_ordinances/379113?nodeId=TIT11HESA_DIV1HECO_CH11.20HO_PT1DE_11.20.020APHO](https://library.municode.com/ca/los_angeles_county/codes/code_of_ordinances/379113?nodeId=TIT11HESA_DIV1HECO_CH11.20HO_PT1DE_11.20.020APHO)

Status, ALLOWED by household definition, subject to building and fire code

### **3. San Diego County, California, Unincorporated Areas, BY RIGHT**

IS,
Family defined as an individual or two or more persons, **related or unrelated**, living together as a single housekeeping unit

IS NOT,
Automatically a boarding or commercial use solely because occupants are unrelated

Primary authority,
San Diego County Zoning Ordinance Update, Family Definition
[https://www.sandiegocounty.gov/content/dam/sdc/pds/zoning/Update99.pdf](https://www.sandiegocounty.gov/content/dam/sdc/pds/zoning/Update99.pdf)

Status, ALLOWED by household definition, subject to building and fire code

## **3E. Zoning vs Licensing Distinction, California**

California zoning regulates **land use**, not care. A dwelling does **NOT** require state licensing unless personal care, supervision, or treatment is provided or the use meets a licensed care category.

Primary authority,
California Health and Safety Code § 1566.3
[https://codes.findlaw.com/ca/health-and-safety-code/hsc-sect-1566-3/](https://codes.findlaw.com/ca/health-and-safety-code/hsc-sect-1566-3/)

## **3F. Jurisdiction Specific Verification Requirement**

Because California zoning authority is local, final compliance determinations must be verified against the specific city or county zoning ordinance applicable to the property location. Insert the live code text and URLs used for the determination into this binder before relying on the analysis.

✅ California Summary, for binder users

Los Angeles, CA, ALLOWED, by household definition
Los Angeles County unincorporated, CA, ALLOWED, by household definition
San Diego County unincorporated, CA, ALLOWED, by household definition

San Luis Obispo, CA, NOT ALLOWED by right
Blue Lake, CA, NOT ALLOWED by right
Benicia, CA, NOT ALLOWED by right

No care license required unless services are provided',
  zoning_section_headers = '[
    {"id": "section-3a-state-zoning-authority-california", "title": "3A. State Zoning Authority, California", "level": 2},
    {"id": "section-3b-household-boarding-rooming-lodging-classifications-california", "title": "3B. Household, Boarding, Rooming, and Lodging Classifications, California", "level": 2},
    {"id": "section-3c-california-jurisdictions-not-allowed", "title": "3C. California Jurisdictions Where Housing 6+ IS NOT ALLOWED", "level": 2},
    {"id": "section-3d-california-jurisdictions-allowed", "title": "3D. California Jurisdictions Where Housing 6+ IS ALLOWED", "level": 2},
    {"id": "section-3e-zoning-vs-licensing-california", "title": "3E. Zoning vs Licensing Distinction, California", "level": 2},
    {"id": "section-3f-jurisdiction-verification-california", "title": "3F. Jurisdiction Specific Verification Requirement", "level": 2}
  ]'::jsonb,
  zoning_word_count = 1050,
  updated_at = NOW()
WHERE state_code = 'CA';

-- ============================================================================
-- 2. FLORIDA (FL)
-- ============================================================================
UPDATE public.state_compliance_binders
SET
  zoning_content = '# **Florida Compliance Binder: Zoning & Occupancy Framework (Shared Housing)**

## **Section 3 — State & Local Zoning and Occupancy Guidelines (Florida)**

## **3A. State Zoning Authority (Florida)**

Florida does **NOT** establish a statewide definition of "family," "household," or a numerical cap on unrelated persons living together in a residential dwelling for zoning purposes.

Florida law delegates zoning and land-use authority to **local governments** (counties and municipalities), which adopt and enforce their own land development regulations, zoning codes, and occupancy definitions.

**IS:**

* Zoning authority is local
* Occupancy limits are set by city or county code

**IS NOT:**

* A uniform statewide family definition
* A statewide unrelated-occupant limit

**Primary authority:**
Florida Statutes, Municipal & County Home Rule (local zoning authority)
[https://www.flsenate.gov/Laws/Statutes](https://www.flsenate.gov/Laws/Statutes)
(See local Land Development Codes for enforceable definitions)

📍 **Compliance impact:** All Florida shared-housing compliance must be evaluated at the **local jurisdiction level**.

## **3B. Household, Rooming, Boarding, and Lodging Classifications (Florida)**

Florida jurisdictions commonly regulate residential occupancy using **multiple distinct classifications**, including:

* **Family / Household (Residential Use)**
* **Rooming House**
* **Boarding House**
* **Lodging House**

These classifications are treated differently by local zoning codes.

**Key compliance rule for this model:**

✅ **ACCEPTABLE**

* Residential household by right
* Residential rooming / boarding / lodging **allowed by permit or zoning approval**
* No services provided
* No state care or facility license required

❌ **NOT ACCEPTABLE**

* Use restricted to **commercial zoning only**, AND
* Requires **business licensing + operational regulation**, AND
* Converts the dwelling into a regulated commercial use

📍 **Compliance impact:**
A rooming, boarding, or lodging classification is **acceptable** if it remains a **residential land use with a permit**, and does **not** require commercial zoning or a care-based license.

## **3C. Florida Jurisdictions Where Housing 6+ Individuals IS Allowed (By Right or Residential Permit)**

### **1. Martin County, Florida**

**IS:**

* Up to **4 unrelated persons** allowed under the residential "family" definition
* **More than 4 occupants** may be housed under a **rooming / boarding classification by zoning approval**
* Treated as a residential use when permitted

**IS NOT:**

* Automatically commercial zoning
* A state-licensed facility (unless services are added)

**Primary authority:**
Martin County Land Development Regulations – Zoning Definitions
https://library.municode.com/fl/martin_county/codes/land_development_regulations

### **2. Palm Beach County, Florida**

**IS:**

* Up to **4 unrelated persons** under the household definition
* **Rooming / boarding houses permitted** in certain residential zones **with zoning approval or permit**
* Residential use remains valid without services

**IS NOT:**

* Automatically classified as commercial
* Automatically subject to state facility licensing

**Primary authority:**
Palm Beach County Unified Land Development Code
https://discover.pbcgov.org/pzb/zoning/Pages/Unified-Land-Development-Code.aspx

### **3. Miami-Dade County, Florida (Unincorporated Areas)**

**IS:**

* Rooming, boarding, and lodging houses **recognized use categories**
* Allowed in certain residential districts with a **Certificate of Use / zoning approval**
* Capable of housing **6 or more adults** without care services

**IS NOT:**

* Automatically commercial zoning
* Automatically licensed as a care facility

**Primary authority:**
Miami-Dade County Zoning Code
https://www.miamidade.gov/global/zoning/home.page

## **3D. Florida Jurisdictions Where Housing 6+ Individuals IS NOT Allowed (Without Commercial Zoning or Licensing)**

### **1. City of Tallahassee, Florida**

**IS:**

* Up to **2 unrelated persons** allowed under the definition of "family"

**IS NOT:**

* More than 2 unrelated adults as a standard residential household
* Rooming / boarding houses allowed by right in single-family zones

Any attempt to exceed 2 unrelated occupants **requires a different use classification**, which is **not permitted by right** in residential districts.

**Primary authority:**
Tallahassee Land Development Code – Family Definition
[https://www.talgov.com/growth/gm_faqs/53](https://www.talgov.com/growth/gm_faqs/53)

### **2. City of Boca Raton, Florida**

**IS:**

* Restrictive household definition with low unrelated-occupant limits

**IS NOT:**

* Residential rooming or boarding by permit in most single-family zones
* Housing 6+ adults without triggering commercial use or licensing

**Primary authority:**
Boca Raton Land Development Code
https://library.municode.com/fl/boca_raton/codes/land_development_code

### **3. City of Orlando, Florida**

**IS:**

* Strict separation between residential use and lodging / shared occupancy
* Lodging and room rentals tied to **registration, business tax, and operational rules**

**IS NOT:**

* A clean residential-permit pathway for 6+ unrelated adults
* Suitable for long-term shared housing without regulatory creep

**Primary authority:**
City of Orlando Home-Sharing & Lodging Regulations
[https://www.orlando.gov/Initiatives/Home-Sharing-Registration](https://www.orlando.gov/Initiatives/Home-Sharing-Registration)

## **3E. Zoning vs. Licensing Distinction (Florida)**

Florida zoning regulates **land use**, not services.

A dwelling **does NOT** become a regulated facility unless:

* Services are provided or coordinated, OR
* A care-based license is triggered, OR
* The use is classified as commercial by zoning

📍 **Compliance anchor:**
Housing-only shared living with no services remains a zoning issue, not a licensing issue.

## **3F. Jurisdiction-Specific Verification Requirement**

Because Florida zoning authority is local, **final compliance must be verified against the specific city or county zoning code** where the property is located.

This section establishes **which jurisdictions are viable** and **which are not** under this housing model.

### **✅ Summary (for your binder users)**

* **Florida DOES allow** housing 6+ adults in many jurisdictions

* **Rooming / boarding / lodging is acceptable** when permitted residentially

* **Commercial zoning + licensing = no-go**

* Always cite the **local code + link**',
  zoning_section_headers = '[
    {"id": "section-3a-state-zoning-authority-florida", "title": "3A. State Zoning Authority (Florida)", "level": 2},
    {"id": "section-3b-household-classifications-florida", "title": "3B. Household, Rooming, Boarding, and Lodging Classifications (Florida)", "level": 2},
    {"id": "section-3c-florida-jurisdictions-allowed", "title": "3C. Florida Jurisdictions Where Housing 6+ IS Allowed", "level": 2},
    {"id": "section-3d-florida-jurisdictions-not-allowed", "title": "3D. Florida Jurisdictions Where Housing 6+ IS NOT Allowed", "level": 2},
    {"id": "section-3e-zoning-vs-licensing-florida", "title": "3E. Zoning vs. Licensing Distinction (Florida)", "level": 2},
    {"id": "section-3f-jurisdiction-verification-florida", "title": "3F. Jurisdiction-Specific Verification Requirement", "level": 2}
  ]'::jsonb,
  zoning_word_count = 950,
  updated_at = NOW()
WHERE state_code = 'FL';

-- ============================================================================
-- 3. GEORGIA (GA)
-- ============================================================================
UPDATE public.state_compliance_binders
SET
  zoning_content = '# **Binder: Zoning & Occupancy Framework (Shared Housing)**

## **Section 3 — State & Local Zoning and Occupancy Guidelines (Georgia)**

### **3A. State Zoning Authority (Georgia)**

Land use and zoning authority in the State of Georgia is governed by the **Zoning Procedures Law**, codified at **O.C.G.A. § 36‑66‑1 et seq.** Under this statutory framework, the State of Georgia does **not** establish substantive zoning classifications, occupancy limits, or definitions of "family," "household," or "dwelling unit" for residential properties.

**Primary authority:**
Georgia Zoning Procedures Law, O.C.G.A. § 36‑66‑1 et seq.
https://law.justia.com/codes/georgia/title-36/chapter-66/

Instead, Georgia law expressly delegates zoning authority to **local governments**, including counties and municipalities, which are empowered to adopt and enforce their own zoning ordinances, definitions, and land‑use regulations.

Accordingly, determinations regarding residential occupancy, unrelated persons living together, household composition, and dwelling unit classification are made **at the local level**, based on the applicable county or municipal zoning code where the property is located.

📍 Purpose: Establishes that Georgia does not impose statewide occupancy or family‑definition limits and confirms that zoning analysis must rely on local ordinances.

### **3B. Dwelling Unit and Household Concepts Under Georgia Zoning Practice**

While definitions vary by jurisdiction, Georgia local zoning ordinances generally regulate residential use based on **land use and household structure**, not the personal characteristics of occupants. Common zoning concepts used across Georgia jurisdictions include:

* **Dwelling / Dwelling Unit** – Typically defined as a building or portion of a building designed or used for residential purposes, containing cooking, sleeping, and sanitary facilities for use by a single household.
* **Family or Household** – Commonly defined as one or more persons living together as a single housekeeping unit. Many local ordinances distinguish between related persons and unrelated persons for purposes of determining whether a household qualifies as a single‑family residential use.

Local zoning codes may place numerical limits on the number of **unrelated adults** who may occupy a dwelling while still being classified as a single household. These limits vary significantly by jurisdiction and zoning district.

📍 Purpose: Frames shared housing analysis around standard zoning concepts used throughout Georgia.

### **3C. Examples of Georgia Jurisdictions With Higher Unrelated Occupancy Allowances**

The following examples illustrate Georgia jurisdictions where zoning definitions allow **four or more unrelated adults** to occupy a dwelling unit while remaining within a residential classification:

1. **City of Atlanta (Fulton and DeKalb Counties)**
   Atlanta''s zoning code historically defines a family to include up to **six unrelated persons** occupying a single dwelling unit, provided the household functions as one housekeeping unit with shared living facilities.

**Primary authority:**
Atlanta Code of Ordinances, Zoning Definitions – "Family"
https://atlanta.elaws.us/code/coor_ptiii_pt16_ch29_sec16-29.001

2. **Franklin County, Georgia**
   Franklin County zoning regulations define a family to include up to **five unrelated persons** living together as a household.

**Primary authority:**
Franklin County Zoning Ordinance, Planning & Zoning
https://www.franklincountyga.gov/planning-zoning

3. **Fulton County (Unincorporated Areas / Certain Municipal Adoptions)**
   In several unincorporated or county‑controlled zoning areas, Fulton County zoning practice permits **four unrelated adults** to occupy a dwelling unit without triggering rooming or boarding house classification, depending on zoning district and property configuration.

**Primary authority:**
Fulton County Code of Ordinances, Zoning
https://library.municode.com/ga/fulton_county

📍 Purpose: Demonstrates that higher‑occupancy shared housing models are feasible under certain Georgia local zoning frameworks.

### **3D. Examples of Georgia Jurisdictions With Strict Unrelated Occupancy Limits**

The following jurisdictions exemplify Georgia localities where zoning ordinances impose **tight limits**, commonly restricting residential occupancy to **two unrelated persons** in single‑family zoning districts:

1. **Athens‑Clarke County, Georgia**
   Athens‑Clarke County zoning ordinances limit single‑family residential occupancy to **no more than two unrelated persons**, absent specific zoning relief or reclassification.

**Primary authority:**
Athens‑Clarke County Code of Ordinances, Zoning Definitions
https://library.municode.com/ga/athens-clarke_county

2. **Cobb County, Georgia**
   Cobb County zoning regulations and enforcement practices traditionally restrict single‑family dwellings to **two unrelated adults**, with additional occupants potentially triggering zoning violations or reclassification.

**Primary authority:**
Cobb County Code of Ordinances, Zoning
https://library.municode.com/ga/cobb_county

3. **Traditional Suburban or Rural Georgia Counties**
   Many smaller Georgia counties and municipalities retain conservative zoning definitions of family, often limiting residential occupancy to **two unrelated individuals** in single‑family districts unless a variance or special zoning approval is obtained.

📍 Purpose: Identifies jurisdictions where higher‑occupancy shared housing models are not viable without zoning changes or variances.

### **3E. Zoning Classification vs. Licensing and Services**

Georgia zoning ordinances regulate **land use**, not the provision of personal services. A residential dwelling occupied by unrelated adults does not become a regulated facility, lodging house, or institutional use solely based on household composition. Zoning classification is affected only when the **use of the property changes**, such as:

* Conversion to a rooming or boarding house with individual room rentals
* Provision of on‑site services or supervision
* Commercial or institutional operation inconsistent with residential zoning

Where a property is used as a single household with shared living facilities and without services, supervision, or commercial operations, it remains a residential use under applicable zoning ordinances.

📍 Purpose: Reinforces separation between zoning classification and licensing or service‑based regulation.

### **3F. Jurisdiction‑Specific Verification Requirement**

Because Georgia zoning authority is local, **final compliance determinations must be verified against the specific municipal or county zoning ordinance applicable to the property location**. This binder section provides a structural and legal framework for evaluating shared housing compliance but does not replace jurisdiction‑specific zoning analysis.

📍 Purpose: Establishes due diligence expectations and avoids over‑generalization across Georgia jurisdictions.',
  zoning_section_headers = '[
    {"id": "section-3a-state-zoning-authority-georgia", "title": "3A. State Zoning Authority (Georgia)", "level": 3},
    {"id": "section-3b-dwelling-unit-household-georgia", "title": "3B. Dwelling Unit and Household Concepts Under Georgia Zoning Practice", "level": 3},
    {"id": "section-3c-georgia-higher-occupancy", "title": "3C. Examples of Georgia Jurisdictions With Higher Unrelated Occupancy Allowances", "level": 3},
    {"id": "section-3d-georgia-strict-limits", "title": "3D. Examples of Georgia Jurisdictions With Strict Unrelated Occupancy Limits", "level": 3},
    {"id": "section-3e-zoning-vs-licensing-georgia", "title": "3E. Zoning Classification vs. Licensing and Services", "level": 3},
    {"id": "section-3f-jurisdiction-verification-georgia", "title": "3F. Jurisdiction‑Specific Verification Requirement", "level": 3}
  ]'::jsonb,
  zoning_word_count = 850,
  updated_at = NOW()
WHERE state_code = 'GA';

-- ============================================================================
-- 4. NORTH CAROLINA (NC)
-- ============================================================================
UPDATE public.state_compliance_binders
SET
  zoning_content = '# **North Carolina Compliance Binder, Zoning & Occupancy Framework, Shared Housing**

## **Section 3, State and Local Zoning and Occupancy Guidelines, North Carolina**

### **3A. State Zoning Authority, North Carolina**

**Land use and zoning authority in North Carolina is governed by Chapter 160D of the North Carolina General Statutes, which consolidates local government authority for planning and development regulation. Under this statutory framework, the State of North Carolina does NOT establish a statewide definition of "family," "household," or a statewide numerical cap on unrelated persons living together in a dwelling. Instead, cities and counties adopt and enforce their own zoning ordinances, land development codes, and local definitions for household composition and occupancy limits.**

**IS,**
**Zoning authority is local**
**Household and unrelated occupant limits are set by city or county ordinance**

**IS NOT,**
**A uniform statewide family definition**
**A statewide unrelated occupant cap**

**Primary authority,**
**North Carolina General Statutes, Chapter 160D, Local Planning and Development Regulation**
[**https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_160D.html**](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_160D.html)

### **3B. Household, Boarding, Rooming, and Group Living Classifications, North Carolina**

**North Carolina jurisdictions commonly regulate residential occupancy using multiple zoning classifications, including,**

**Family, Household, Residential Use**
**Boardinghouse**
**Rooming House**
**Group Living, Co Living Uses**

**These are zoning classifications and are separate from licensing. A dwelling does NOT require state licensure unless regulated care, supervision, or treatment is provided and the use meets a state licensing category.**

**Key compliance rule for this model,**

**ACCEPTABLE,**
**Residential household by right, OR**
**Boarding, rooming, group living allowed by special use, conditional use, or zoning approval**
**No care, supervision, or services provided**
**No adult care home license required**

**NOT ACCEPTABLE,**
**Use restricted to commercial zoning only, AND**
**Requires operational or care based licensing, AND**
**Converts the dwelling into an institutional facility**

### **3C. North Carolina Jurisdictions Where Housing 6 or More Individuals IS NOT ALLOWED, By Right**

#### **1. Town of Boone, North Carolina**

**IS,**
**Occupancy limited to one family, OR up to two unrelated persons in certain residential areas**

**IS NOT,**
**Residential housing for 6 unrelated adults by right**

**Primary authority,**
**Town of Boone, Housing and Neighborhoods, Occupancy Information**
[**https://www.townofboone.net/196/Housing-Neighborhoods-Occupancy-Informat**](https://www.townofboone.net/196/Housing-Neighborhoods-Occupancy-Informat)

**Status, NOT ALLOWED**

#### **2. City of Greenville, North Carolina**

**IS,**
**Maximum three unrelated persons permitted in a single family dwelling, enforced locally**

**IS NOT,**
**Residential housing for 6 unrelated adults by right**

**Primary authority,**
**Greenville unrelated occupancy rule, enforcement guidance used for local compliance, off campus housing resource**
[**https://east-carolina-university.helpscoutdocs.com/article/3356-3-unrelated-rule-for-single-family-dwellings**](https://east-carolina-university.helpscoutdocs.com/article/3356-3-unrelated-rule-for-single-family-dwellings)

**Status, NOT ALLOWED**

#### **3. Town of Plymouth, North Carolina**

**IS,**
**Rooming, boarding style rental in an owner occupied single family dwelling limited to no more than four unrelated persons, as defined in the town code**

**IS NOT,**
**Residential housing for 6 unrelated adults by right**

**Primary authority,**
**Town of Plymouth Code of Ordinances, definition limiting unrelated renters**
[**https://codelibrary.amlegal.com/codes/plymouthnc/latest/plymouth_nc/0-0-0-4342**](https://codelibrary.amlegal.com/codes/plymouthnc/latest/plymouth_nc/0-0-0-4342)

**Status, NOT ALLOWED**

### **3D. North Carolina Jurisdictions Where Housing 6 or More Individuals IS ALLOWED, By Right or By Zoning Approval, Not Licensed**

#### **1. City of Charlotte, North Carolina, BY RIGHT**

**Charlotte allows up to six unrelated individuals to live together as a household in a residential district.**

**IS,**
**Up to six unrelated individuals allowed as a household in a residential district**
**Treated as a residential use**
**No special permit required for the household definition pathway**
**No care or facility license triggered by occupancy alone**

**IS NOT,**
**A boarding or commercial use by default**
**A licensed care setting**

**Primary authority,**
**City of Charlotte, Zoning Frequently Asked Questions, residential district occupancy statement**
[**https://www.charlottenc.gov/Growth-and-Development/Planning-and-Development/Zoning/Frequently-Asked-Questions**](https://www.charlottenc.gov/Growth-and-Development/Planning-and-Development/Zoning/Frequently-Asked-Questions)

**Supporting authority, full ordinance portal,**
**Charlotte Unified Development Ordinance landing page**
[**https://www.charlottenc.gov/Growth-and-Development/Planning-and-Development/Planning/Unified-Development-Ordinance**](https://www.charlottenc.gov/Growth-and-Development/Planning-and-Development/Planning/Unified-Development-Ordinance)

**Status, ALLOWED, residential by right**

#### **2. City of Raleigh, North Carolina, ZONING APPROVAL PATHWAY, NOT LICENSED**

**Raleigh recognizes "boardinghouse" within its zoning framework and regulates it as a land use category that allows more than four unrelated persons, with a maximum of six occupants, subject to zoning standards.**

**IS,**
**Boardinghouse defined as housing more than 4 unrelated persons**
**Maximum occupancy capped at 6 individuals**
**Allowed through zoning standards and approval pathway in applicable districts**
**Not a state licensed care facility unless services are provided**

**IS NOT,**
**Automatically commercial zoning**
**A care or treatment facility by default**

**Primary authority,**
**Raleigh Unified Development Ordinance, Group Living section, includes boardinghouse standards and occupancy cap**
[**https://udo.raleighnc.gov/sec-622-group-living**](https://udo.raleighnc.gov/sec-622-group-living)

**Status, ALLOWED, by zoning approval, not licensed**

### **3E. Zoning vs Licensing Distinction, North Carolina**

**North Carolina zoning regulates land use, not care. A dwelling does NOT require state licensing unless personal care, supervision, or treatment is provided or the use meets the definition of a licensed adult care home.**

**Primary authority,**
**NC DHHS, Adult Care Licensure and Certification, Adult Care Home Licensure overview**
[**https://info.ncdhhs.gov/dhsr/acls/**](https://info.ncdhhs.gov/dhsr/acls/)

### **3F. Jurisdiction Specific Verification Requirement**

**Because North Carolina zoning authority is local, final compliance determinations must be verified against the specific municipal or county zoning ordinance applicable to the property location. Insert the live code text and URLs used for the determination into this binder before relying on the analysis.**

**✅ North Carolina Summary, for binder users**

**Charlotte, NC, ALLOWED, by right, up to 6 unrelated, link provided**
**Raleigh, NC, ALLOWED, by zoning approval pathway, boardinghouse, capped at 6, link provided**
**Boone, NC, NOT ALLOWED, by right, limited to 2 unrelated in applicable residential areas, link provided**
**Greenville, NC, NOT ALLOWED, by right, capped at 3 unrelated, enforcement guidance link provided**
**Plymouth, NC, NOT ALLOWED, by right, capped at 4 unrelated in owner occupied rooming arrangement, link provided**',
  zoning_section_headers = '[
    {"id": "section-3a-state-zoning-authority-nc", "title": "3A. State Zoning Authority, North Carolina", "level": 3},
    {"id": "section-3b-household-classifications-nc", "title": "3B. Household, Boarding, Rooming, and Group Living Classifications, North Carolina", "level": 3},
    {"id": "section-3c-nc-not-allowed", "title": "3C. North Carolina Jurisdictions Where Housing 6+ IS NOT ALLOWED", "level": 3},
    {"id": "section-3d-nc-allowed", "title": "3D. North Carolina Jurisdictions Where Housing 6+ IS ALLOWED", "level": 3},
    {"id": "section-3e-zoning-vs-licensing-nc", "title": "3E. Zoning vs Licensing Distinction, North Carolina", "level": 3},
    {"id": "section-3f-jurisdiction-verification-nc", "title": "3F. Jurisdiction Specific Verification Requirement", "level": 3}
  ]'::jsonb,
  zoning_word_count = 1000,
  updated_at = NOW()
WHERE state_code = 'NC';

-- ============================================================================
-- 5. SOUTH CAROLINA (SC)
-- ============================================================================
UPDATE public.state_compliance_binders
SET
  zoning_content = '# **South Carolina Compliance Binder, Zoning & Occupancy Framework, Shared Housing**

## **Section 3, State and Local Zoning and Occupancy Guidelines, South Carolina**

### **3A. State Zoning Authority, South Carolina**

Land use and zoning authority in South Carolina is governed primarily by **Title 6, Chapter 29 of the South Carolina Code of Laws (Zoning Enabling Act)**. Under this statutory framework, the State of South Carolina does **NOT** establish a statewide definition of "family," "household," or a statewide numerical cap on unrelated persons living together in a dwelling. Zoning authority is delegated to **local governments**, which adopt and enforce their own zoning ordinances, land development regulations, and occupancy definitions.

IS,
Zoning authority is local
Household and unrelated occupant limits are set by city or county ordinance

IS NOT,
A uniform statewide family definition
A statewide unrelated occupant cap

Primary authority,
South Carolina Code of Laws, Title 6, Chapter 29, Zoning
[https://www.scstatehouse.gov/code/t06c029.php](https://www.scstatehouse.gov/code/t06c029.php)

### **3B. Household, Boarding, Rooming, and Group Living Classifications, South Carolina**

South Carolina jurisdictions commonly regulate residential occupancy using multiple zoning classifications, including,

Family, Household, Residential Use
Boardinghouse
Rooming House
Lodging House
Group Living or Congregate Living Uses

These are **zoning classifications**, not licenses. A dwelling does **NOT** require state licensure unless regulated care, supervision, or treatment is provided and the use meets a separate licensing category.

Key compliance rule for this model,

ACCEPTABLE,
Residential household by right, OR
Rooming, boarding, or lodging use allowed by permit, conditional use, or zoning approval
No care, supervision, or services provided
No state care or facility license required

NOT ACCEPTABLE,
Use restricted to commercial zoning only, AND
Requires operational or care based licensing, AND
Converts the dwelling into an institutional facility

### **3C. South Carolina Jurisdictions Where Housing 6 or More Individuals IS NOT ALLOWED, By Right**

#### **1. City of Clemson, South Carolina**

IS,
Occupancy in single family residential zones limited to one family or a small number of unrelated persons, enforced through local zoning and housing ordinances

IS NOT,
Residential housing for 6 unrelated adults by right

Primary authority,
City of Clemson Code of Ordinances, Zoning and Occupancy
[https://library.municode.com/sc/clemson/codes/code_of_ordinances](https://library.municode.com/sc/clemson/codes/code_of_ordinances)

Status, NOT ALLOWED

#### **2. City of Rock Hill, South Carolina**

IS,
Local zoning definitions of family and household restrict the number of unrelated individuals in single family districts

IS NOT,
Residential housing for 6 unrelated adults by right without rezoning or special approval

Primary authority,
City of Rock Hill Code of Ordinances, Zoning
[https://library.municode.com/sc/rock_hill/codes/code_of_ordinances](https://library.municode.com/sc/rock_hill/codes/code_of_ordinances)

Status, NOT ALLOWED

#### **3. City of Columbia, South Carolina (Single Family Districts)**

IS,
Single family zoning districts limit unrelated occupancy under the family definition

IS NOT,
Housing for 6 unrelated adults by right in single family residential zones

Primary authority,
City of Columbia Zoning Ordinance
[https://www.columbiasc.gov/planning-development-services/zoning](https://www.columbiasc.gov/planning-development-services/zoning)

Status, NOT ALLOWED by right

### **3D. South Carolina Jurisdictions Where Housing 6 or More Individuals IS ALLOWED, By Right or By Zoning Approval, Not Licensed**

#### **1. City of Charleston, South Carolina, ZONING APPROVAL PATHWAY**

Charleston recognizes **boarding houses and lodging houses** as zoning use categories that may be permitted in certain residential or mixed use zoning districts subject to zoning approval.

IS,
Boarding or lodging houses recognized as zoning uses
Housing of 6 or more adults permitted by zoning approval in applicable districts
Treated as a zoning use, not a care facility
No state care license required unless services are provided

IS NOT,
Automatically commercial zoning only
A licensed care or treatment facility by default

Primary authority,
City of Charleston Zoning Ordinance, Boarding and Lodging House Uses
[https://www.charleston-sc.gov/150/Zoning](https://www.charleston-sc.gov/150/Zoning)

Status, ALLOWED by zoning approval, not licensed

#### **2. City of North Charleston, South Carolina, ZONING APPROVAL PATHWAY**

North Charleston zoning allows **boardinghouses and rooming houses** in specific zoning districts with zoning approval and compliance with spacing and operational standards.

IS,
Boarding or rooming houses recognized as zoning use categories
Permitted in designated districts with zoning approval
Capable of housing 6 or more adults depending on district and standards

IS NOT,
Automatically classified as commercial use
A care facility unless services are provided

Primary authority,
City of North Charleston Code of Ordinances, Zoning
[https://library.municode.com/sc/north_charleston/codes/code_of_ordinances](https://library.municode.com/sc/north_charleston/codes/code_of_ordinances)

Status, ALLOWED by zoning approval, not licensed

#### **3. City of Greenville, South Carolina, CONDITIONAL USE PATHWAY**

Greenville zoning recognizes **lodging houses and boarding houses** as conditional uses in certain residential and mixed use districts.

IS,
Lodging and boarding houses recognized as zoning uses
Allowed through conditional use or zoning approval process
No state licensing required absent care services

IS NOT,
Automatically permitted in all residential districts
A licensed care facility by default

Primary authority,
City of Greenville Zoning Ordinance
[https://www.greenvillesc.gov/167/Zoning-Ordinance](https://www.greenvillesc.gov/167/Zoning-Ordinance)

Status, ALLOWED by conditional zoning approval

### **3E. Zoning vs Licensing Distinction, South Carolina**

South Carolina zoning regulates **land use**, not care. A dwelling does **NOT** require state licensing unless personal care, supervision, or treatment is provided or the use meets a licensed care category under state law.

Primary authority,
South Carolina Department of Health and Environmental Control, Residential Care Facility Licensing
[https://scdhec.gov/health/facilities-licensing](https://scdhec.gov/health/facilities-licensing)

### **3F. Jurisdiction Specific Verification Requirement**

Because South Carolina zoning authority is local, final compliance determinations must be verified against the specific municipal or county zoning ordinance applicable to the property location. Insert the live code text and URLs used for the determination into this binder before relying on the analysis.

✅ South Carolina Summary, for binder users

Charleston, SC, ALLOWED, zoning approval pathway, boarding or lodging house, link provided
North Charleston, SC, ALLOWED, zoning approval pathway, boarding or rooming house, link provided
Greenville, SC, ALLOWED, conditional use zoning pathway, link provided
Columbia, SC, NOT ALLOWED by right in single family districts
Rock Hill, SC, NOT ALLOWED by right
Clemson, SC, NOT ALLOWED by right
No care license required unless services are provided',
  zoning_section_headers = '[
    {"id": "section-3a-state-zoning-authority-sc", "title": "3A. State Zoning Authority, South Carolina", "level": 3},
    {"id": "section-3b-household-classifications-sc", "title": "3B. Household, Boarding, Rooming, and Group Living Classifications, South Carolina", "level": 3},
    {"id": "section-3c-sc-not-allowed", "title": "3C. South Carolina Jurisdictions Where Housing 6+ IS NOT ALLOWED", "level": 3},
    {"id": "section-3d-sc-allowed", "title": "3D. South Carolina Jurisdictions Where Housing 6+ IS ALLOWED", "level": 3},
    {"id": "section-3e-zoning-vs-licensing-sc", "title": "3E. Zoning vs Licensing Distinction, South Carolina", "level": 3},
    {"id": "section-3f-jurisdiction-verification-sc", "title": "3F. Jurisdiction Specific Verification Requirement", "level": 3}
  ]'::jsonb,
  zoning_word_count = 900,
  updated_at = NOW()
WHERE state_code = 'SC';

-- ============================================================================
-- 6. TEXAS (TX)
-- ============================================================================
UPDATE public.state_compliance_binders
SET
  zoning_content = '# **Texas Compliance Binder, Zoning & Occupancy Framework, Shared Housing (Expanded Cities)**

## **Section 3 — State & Local Zoning and Occupancy Guidelines, Texas**

## **3C. Texas Jurisdictions Where Housing 6 or More Individuals IS NOT ALLOWED, By Right**

(These cities restrict unrelated occupancy in single-family zoning and do not offer a clean residential permit pathway.)

### **1. City of College Station, Texas**

IS,
Single-family zoning limits unrelated occupancy under the family definition.

IS NOT,
Housing for 6 unrelated adults by right.

Primary authority,
City of College Station Code of Ordinances
[https://library.municode.com/tx/college_station/codes/code_of_ordinances](https://library.municode.com/tx/college_station/codes/code_of_ordinances)

Status, NOT ALLOWED by right

### **2. City of Plano, Texas**

IS,
Family definition restricts unrelated occupancy in single-family residential districts.

IS NOT,
Housing for 6 unrelated adults by right without zoning relief.

Primary authority,
City of Plano Zoning Ordinance
[https://library.municode.com/tx/plano/codes/code_of_ordinances](https://library.municode.com/tx/plano/codes/code_of_ordinances)

Status, NOT ALLOWED by right

### **3. City of Lubbock, Texas**

IS,
Single-family zoning districts restrict unrelated occupancy under the family definition.

IS NOT,
Housing for 6 unrelated adults by right.

Primary authority,
City of Lubbock Code of Ordinances
[https://library.municode.com/tx/lubbock/codes/code_of_ordinances](https://library.municode.com/tx/lubbock/codes/code_of_ordinances)

Status, NOT ALLOWED by right

### **4. City of McKinney, Texas**

IS,
Family definition limits unrelated individuals in single-family residential zoning.

IS NOT,
Housing for 6 unrelated adults by right.

Primary authority,
City of McKinney Code of Ordinances
[https://library.municode.com/tx/mckinney/codes/code_of_ordinances](https://library.municode.com/tx/mckinney/codes/code_of_ordinances)

Status, NOT ALLOWED by right

## **3D. Texas Jurisdictions Where Housing 6 or More Individuals IS ALLOWED, By Right or By Zoning Approval, NOT LICENSED**

(This is where Texas shines.)

### **1. City of Houston, Texas — NON-ZONED CITY (BY RIGHT)**

Houston does not use traditional zoning. Residential occupancy is governed by building, fire, and property maintenance codes rather than household definitions.

IS,
No zoning-based unrelated occupancy cap
Housing of 6 or more unrelated adults permitted
Regulated by safety and habitability standards, not zoning
No care license required unless services are provided

IS NOT,
A commercial use by default
A licensed care facility

Primary authority,
City of Houston Planning & Development
[https://www.houstontx.gov/planning/](https://www.houstontx.gov/planning/)

Status, ALLOWED by right (non-zoned city)

### **2. City of San Antonio, Texas — ZONING APPROVAL PATHWAY**

San Antonio zoning recognizes **boarding house / group residential uses** as zoning categories in certain districts.

IS,
Boarding or group residential uses recognized
Housing of 6 or more adults allowed in applicable districts
Permitted through zoning approval or specific use permit
No care license required absent services

IS NOT,
Automatically commercial zoning
A licensed care facility

Primary authority,
City of San Antonio Unified Development Code
https://www.sanantonio.gov/DSD/UDC

Status, ALLOWED by zoning approval

### **3. City of Dallas, Texas — ZONING APPROVAL PATHWAY**

Dallas zoning allows **lodging house and group residential uses** in designated zoning districts.

IS,
Lodging / group residential recognized by zoning
Housing of 6 or more adults permitted in designated districts
No state care license required unless services are provided

IS NOT,
Permitted by right in single-family districts
A licensed care facility

Primary authority,
City of Dallas Development Code
[https://dallascityhall.com/departments/pnv/Pages/zoning.aspx](https://dallascityhall.com/departments/pnv/Pages/zoning.aspx)

Status, ALLOWED by zoning approval

### **4. City of Austin, Texas — GROUP RESIDENTIAL PATHWAY**

Austin zoning includes **group residential and boarding-type uses** with zoning approval.

IS,
Group residential uses defined
Housing of 6 or more adults allowed in approved districts
No care license required absent services

IS NOT,
Automatically permitted in all residential zones
A licensed care facility

Primary authority,
City of Austin Land Development Code
https://www.austintexas.gov/page/land-development-code

Status, ALLOWED by zoning approval

### **5. City of Fort Worth, Texas — ZONING APPROVAL PATHWAY**

Fort Worth zoning allows **boarding or rooming houses** in certain zoning districts.

IS,
Boarding / rooming houses recognized as zoning uses
Housing of 6 or more adults allowed in applicable districts
Permitted through zoning approval
No care license required unless services are provided

IS NOT,
Automatically commercial zoning
A licensed care facility

Primary authority,
City of Fort Worth Zoning Ordinance
[https://www.fortworthtexas.gov/departments/development-services/zoning](https://www.fortworthtexas.gov/departments/development-services/zoning)

Status, ALLOWED by zoning approval

### **6. City of El Paso, Texas — ZONING APPROVAL PATHWAY**

El Paso zoning recognizes **rooming and lodging houses** in certain zoning districts.

IS,
Rooming / lodging houses recognized
Housing of 6 or more adults permitted in designated districts
No care license required absent services

IS NOT,
Automatically permitted in single-family zoning
A licensed care facility

Primary authority,
City of El Paso Code of Ordinances
[https://library.municode.com/tx/el_paso/codes/code_of_ordinances](https://library.municode.com/tx/el_paso/codes/code_of_ordinances)

Status, ALLOWED by zoning approval

## **3E. Zoning vs Licensing Distinction, Texas**

Texas zoning regulates **land use**, not care.

A dwelling does NOT require state licensing unless personal care, supervision, or treatment is provided or the use meets a licensed care category.

Primary authority,
Texas Health and Human Services, Facility Licensing
[https://www.hhs.texas.gov/providers/health-care-facilities-regulation](https://www.hhs.texas.gov/providers/health-care-facilities-regulation)

## **✅ Texas Expanded Summary, for binder users**

Houston, TX — ALLOWED by right (non-zoned city)
San Antonio, TX — ALLOWED by zoning approval
Dallas, TX — ALLOWED by zoning approval
Austin, TX — ALLOWED by zoning approval
Fort Worth, TX — ALLOWED by zoning approval
El Paso, TX — ALLOWED by zoning approval

College Station, TX — NOT allowed by right
Plano, TX — NOT allowed by right
Lubbock, TX — NOT allowed by right
McKinney, TX — NOT allowed by right

No care license required unless services are provided.',
  zoning_section_headers = '[
    {"id": "section-3c-texas-not-allowed", "title": "3C. Texas Jurisdictions Where Housing 6+ IS NOT ALLOWED", "level": 2},
    {"id": "section-3d-texas-allowed", "title": "3D. Texas Jurisdictions Where Housing 6+ IS ALLOWED", "level": 2},
    {"id": "section-3e-zoning-vs-licensing-texas", "title": "3E. Zoning vs Licensing Distinction, Texas", "level": 2}
  ]'::jsonb,
  zoning_word_count = 1100,
  updated_at = NOW()
WHERE state_code = 'TX';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after migration to confirm zoning content was added:
--
-- SELECT
--   state_code,
--   state_name,
--   CASE WHEN zoning_content IS NOT NULL THEN 'YES' ELSE 'NO' END as has_zoning,
--   zoning_word_count
-- FROM public.state_compliance_binders
-- WHERE state_code IN ('CA', 'FL', 'GA', 'NC', 'SC', 'TX')
-- ORDER BY state_code;
--
-- Expected result: All 6 states should have has_zoning = 'YES'
-- ============================================================================
