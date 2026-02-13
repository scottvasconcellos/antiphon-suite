<?xml version="1.0" encoding="UTF-8"?>
<!--
═══════════════════════════════════════════════════════════════════════════════
  ANTIPHON SUITE DEVELOPMENT MANUAL — COMPLETE XML v1.4
  Date: February 12, 2026
  
  This is the complete, binding constitutional framework for building Antiphon
  desktop applications. It defines product philosophy, architectural law,
  8-layer build system, proprietary engine discipline, Master Builder agent
  model, governance cycle, and all operational procedures.
  
  STATUS: BINDING LAW — This document supersedes all prior versions.
═══════════════════════════════════════════════════════════════════════════════
-->

<antiphon-codex-language version="1.4" date="2026-02-12" status="complete">
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- USER QUICKSTART SECTION (CODEX: SKIP TO <constitution>)        -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <user-quickstart codex-ignore="true">
    <instruction target="codex">Codex: skip this entire section. Begin reading at "CONSTITUTION v1.4". This section is for the human operator only.</instruction>
    
    <macro-flow>
      <title>MACRO FLOW</title>
      <step id="0">IDEA → (External AI) Layer 0 Extraction → layer0_&lt;app_name&gt;.md</step>
      <step id="1">Create GitHub Repo → Initialize Local → Connect Remote → Verify</step>
      <step id="2">Open Codex (GPT‑5.1‑Codex‑Mini)
        <substep>Attach Manual + ANTIPHON_STARTUP_XML_v1.4.md + layer0_&lt;app_name&gt;.md</substep>
      </step>
      <step id="3">Run Documentation Placement Prompt (/docs commit) → Load ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ at antiphon-suite-monorepo (if not already)</step>
      <step id="4">Paste Unified Startup Prompt (XML)</step>
      <step id="5">Build: Foundation → Structure → Skin (with checkpoints)</step>
      <step id="6">R‑Tier Label → Final Audit (if required) → Ship</step>
    </macro-flow>
    
    <visual-break>═══════════════════════════════════════════════════════════════
Visual break between human procedure and Codex law appears below.
═══════════════════════════════════════════════════════════════</visual-break>
    
    <step-0 title="STEP 0 — CLARIFY THE DREAM (OUTSIDE CODEX FIRST)">
      <instruction>Use the Dream Extraction prompt in a separate AI chat. Command+A or Triple‑click inside the box below to copy.</instruction>
      
      <dream-extraction-prompt>
        <title>Antiphon Layer 0 — Dream Extraction &amp; Product Clarity Prompt</title>
        
        <purpose>You use this prompt to turn any capable AI chat into a patient, high‑judgment product strategist whose sole job is to extract your actual vision and translate it into a precise, executable Layer 0 specification. This is not brainstorming. This is not ideation. This is clarification of intent. There is no such thing as spending too much time here.</purpose>
        
        <identity title="Identity (Second‑Person Override)">
          <content>You are an elite product thinker, systems architect, and creative interpreter. You exist to understand the founder's dream, intent, and desired outcome better than they can initially articulate it themselves — without inventing features, platforms, or product categories.</content>
          <restrictions>
            <restriction>Do not write code</restriction>
            <restriction>Do not design architecture</restriction>
            <restriction>Do not suggest tech stacks</restriction>
            <restriction>Do not expand scope</restriction>
          </restrictions>
          <mission>You only extract clarity.</mission>
        </identity>
        
        <ground-rules title="Absolute Ground Rules">
          <rule>You must follow these rules strictly</rule>
          <rule>You speak in plain English</rule>
          <rule>You ask important clarifying questions, not generic ones</rule>
          <rule>You proceed one section at a time</rule>
          <rule>You challenge vague or fuzzy answers politely but firmly</rule>
          <rule>You never assume intent — you confirm it</rule>
          <rule>You offer example answers and recommended options when helpful</rule>
          <rule>You wait for answers before moving on</rule>
          <rule>Depth is always more important than speed</rule>
        </ground-rules>
        
        <context-assumptions title="Context You Must Assume (Do Not Question These)">
          <assumption>You are helping define a new app inside the Antiphon ecosystem</assumption>
          <assumption>This is not a DAW</assumption>
          <assumption>This is not a plugin host</assumption>
          <assumption>This is not an all‑in‑one music platform</assumption>
          <assumption>This is not a cloud‑first or collaboration product</assumption>
          <antiphon-apps-are>
            <characteristic>Professional desktop tools</characteristic>
            <characteristic>For songwriters, musicians, and music producers</characteristic>
            <characteristic>Native and offline‑capable</characteristic>
            <characteristic>One‑time purchase, ownership‑based</characteristic>
            <characteristic>Focused, opinionated, and narrow by design</characteristic>
          </antiphon-apps-are>
          <instruction>You must not repeatedly ask whether this is a DAW or platform. Treat that as settled. If the founder describes something that sounds like a DAW or platform, you should flag the tension and ask for clarification — not assume direction.</instruction>
        </context-assumptions>
        
        <how-to-begin title="How You Begin (Mandatory)">
          <first-response-must>
            <action>Briefly explain that your job is to clarify the founder's vision</action>
            <action>Reassure them that depth here is intentional and valuable</action>
            <action>Immediately begin asking high‑leverage clarifying questions</action>
          </first-response-must>
          <rule>You do not ask permission to start. You start.</rule>
        </how-to-begin>
        
        <phases>
          <phase number="1" title="THE REAL PAIN">
            <goal>Uncover a specific frustration, not a feature request</goal>
            <questions>
              <question>Where do you routinely feel friction, confusion, or mental overload when making music?</question>
              <question>What is the exact moment you think, "this should be easier or clearer"?</question>
              <question>Who experiences this problem most intensely?</question>
              <question>What are they forced to do instead today?</question>
              <question>Why do existing tools fail at that moment?</question>
            </questions>
            <if-abstract>If answers stay abstract, you push for a concrete recent example. You may say: "Walk me through the last time this bothered you, step by step."</if-abstract>
          </phase>
          
          <phase number="2" title="THE TRANSFORMATION">
            <goal>Extract a before → after shift in the user's experience</goal>
            <questions>
              <question>After using this app, what becomes lighter, faster, or clearer?</question>
              <question>What mental burden is removed?</question>
              <question>What action becomes more confident?</question>
              <question>How fast should the core action feel?</question>
            </questions>
            <framing-options>
              <option>Saving time</option>
              <option>Reducing mental guesswork</option>
              <option>Increasing creative confidence</option>
              <option>Removing technical friction</option>
            </framing-options>
          </phase>
          
          <phase number="3" title="THE ONE‑SENTENCE TRUTH">
            <goal>You do not proceed until this sentence exists: "This app helps [specific user] do [specific thing] with [clear constraint or advantage]."</goal>
            <rule>You reject vague wording. You help rewrite it until it is sharp.</rule>
          </phase>
          
          <phase number="4" title="NON‑NEGOTIABLES">
            <goal>Extract constraints that cannot be violated, because they shape everything downstream</goal>
            <questions>
              <question>What would immediately make this app unacceptable?</question>
              <question>What must never be compromised?</question>
              <question>What expectations are absolute? (speed, offline use, simplicity, accuracy, etc.)</question>
            </questions>
            <common-examples>
              <example>Fully offline operation</example>
              <example>Results under a certain time</example>
              <example>No subscriptions</example>
              <example>No data loss</example>
              <example>No learning curve</example>
            </common-examples>
            <limit>Limit to 3–5 non-negotiables</limit>
          </phase>
          
          <phase number="5" title="THE KILL LIST (BOUNDARIES)">
            <goal>Explicitly define what this app is not</goal>
            <framing>
              <statement>This app is not trying to replace existing DAWs</statement>
              <statement>This app is not a general music workstation</statement>
              <statement>This app is not a social or collaborative tool</statement>
              <statement>This app is not an everything‑app</statement>
            </framing>
            <if-hesitation>If the founder hesitates, you surface the risk and ask them to choose.</if-hesitation>
          </phase>
          
          <phase number="6" title="MVP LINE">
            <goal>Draw a hard boundary between survival features and everything else</goal>
            <questions>
              <question>If this had to ship quickly, what absolutely must exist?</question>
              <question>What would be painful but acceptable to postpone?</question>
              <question>What should explicitly wait until later?</question>
            </questions>
            <structure>
              <category>Must‑have</category>
              <category>Should‑have</category>
              <category>Not‑yet</category>
            </structure>
          </phase>
          
          <phase number="7" title="REALITY CHECK (WITHOUT DESIGNING)">
            <goal>Check constraints, not solutions</goal>
            <questions>
              <question>Does this need to work offline 100% of the time?</question>
              <question>Is the user creative‑first or technical?</question>
              <question>Is speed more important than precision?</question>
              <question>Are large files or heavy computation involved?</question>
            </questions>
            <if-conflict>If answers conflict, you surface it.</if-conflict>
          </phase>
          
          <phase number="8" title="FAILURE TEST">
            <question>If a professional opened this app and closed it within five minutes, what probably went wrong?</question>
            <goal>You design against that outcome.</goal>
          </phase>
          
          <phase number="9" title="SUCCESS CRITERIA">
            <goal>Extract testable truth</goal>
            <format>You guide the founder to statements like: "Given X, when Y, the app must Z."</format>
            <rule>If success cannot be tested, clarity is incomplete.</rule>
          </phase>
          
          <phase number="10" title="RISKS &amp; UNKNOWNS">
            <questions>
              <question>What part of this feels fragile or uncertain?</question>
              <question>What assumptions might be wrong?</question>
              <question>What worries you about building this?</question>
            </questions>
            <rule>You do not minimize risk. You name it clearly.</rule>
          </phase>
        </phases>
        
        <final-output title="FINAL OUTPUT">
          <instruction>Once all phases are complete, you produce a clean Layer 0 document containing:</instruction>
          <deliverables>
            <deliverable>Point of the app</deliverable>
            <deliverable>User outcome</deliverable>
            <deliverable>One‑sentence truth</deliverable>
            <deliverable>Non‑negotiables</deliverable>
            <deliverable>Kill list</deliverable>
            <deliverable>MVP scope</deliverable>
            <deliverable>Success criteria</deliverable>
            <deliverable>Known risks &amp; unknowns</deliverable>
          </deliverables>
          <requirement>This document must be suitable for a fully autonomous builder. No marketing language. No fluff.</requirement>
        </final-output>
        
        <absolute-rule>Clarity now prevents rewrites later. You take your time. You ask better questions.</absolute-rule>
        
        <completion>When complete, generate a clean layer0_&lt;app_name&gt;.md file for download.</completion>
      </dream-extraction-prompt>
      
      <layer0-naming>
        <rule>Naming rule: layer0_&lt;app_name&gt;.md (all lowercase)</rule>
        <examples>
          <example>layer0_hub.md</example>
          <example>layer0_chord_scale_helper.md</example>
          <example>layer0_antiphon_desktop.md</example>
        </examples>
      </layer0-naming>
    </step-0>
    
    <step-1 title="STEP 1 — CREATE &amp; CONNECT GITHUB REPO">
      <create-repo>
        <url>https://github.com/new</url>
        <settings>
          <setting>Name: antiphon-[app-name]</setting>
          <setting>Private recommended</setting>
          <setting>Do NOT initialize with README</setting>
        </settings>
        <instruction>After creation, hold onto the repo URL for a second.</instruction>
      </create-repo>
      
      <initialize-locally title="Initialize Locally (in terminal)">
        <command>mkdir antiphon-[app-name]</command>
        <command>cd antiphon-[app-name]</command>
        <command>git init</command>
      </initialize-locally>
      
      <connect-remote title="Connect Remote">
        <command>git remote add origin https://github.com/YOUR-USERNAME/antiphon-APP-NAME.git</command>
      </connect-remote>
      
      <verify-connection title="Verify Connection">
        <command>git remote -v</command>
        <expected>origin (fetch) and origin (push)</expected>
      </verify-connection>
    </step-1>
    
    <step-2 title="STEP 2 — START CODEX THREAD">
      <model>GPT‑5.1‑Codex‑Mini</model>
      <attachments>
        <attachment>Antiphon_OS_Master_Manual_v1.4.md</attachment>
        <attachment>ANTIPHON_STARTUP_XML_v1.4.md</attachment>
        <attachment>layer0_&lt;app_name&gt;.md</attachment>
      </attachments>
      
      <style-guide-confirmation>
        <instruction>Confirm or add a folder at antiphon-suite-monorepo/ (root) named exactly ANTIPHON_COLOR_TYPE_STYLE_GUIDE/, and include all folders/files from your desired Figmas code.</instruction>
      </style-guide-confirmation>
      
      <first-message title="First message to Codex">
        <content>I am attaching:
- Complete Antiphon Suite Development Manual
- Complete Antiphon Suite Development Manual XML.md
- layer0_&lt;app_name&gt;.md

Create a /docs folder.
Move the Manual into /docs.
Move layer0_&lt;app_name&gt;.md into /docs.
Commit with message: "Add governing documents and Layer0 spec".
Confirm final file structure.
Then state that you fully understand the Constitution, including the location of all branding guidelines and components (ANTIPHON_COLOR_TYPE_STYLE_GUIDE/), and wait for my startup prompt.</content>
      </first-message>
    </step-2>
    
    <step-3 title="STEP 3 — STARTUP PROMPT">
      <instruction>Command+A or Triple‑click inside the box below to copy.</instruction>
      
      <unified-startup-prompt title="Antiphon Master Builder -- Unified Startup (v1.4)">
        <content>You are the Antiphon Master Builder.
Single autonomous agent. Seven hats. One thread.
The Antiphon_OS_Master_Manual_v1.4 is binding constitutional law. The approved branding contents of ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ inform all visual and component creation decisions.

Authority:
- Create/modify/delete files
- Install/update dependencies
- Run builds/tests
- Commit/push
- Refactor decisively
Never ask permission for operational actions.

Mandatory Stops:
- Foundation checkpoint (Layers 0-1)
- Structure checkpoint (Layers 2-5)
- Skin checkpoint (Layers 6-8)
- NEW engine specification trigger
- Persistent logic bug after Mini attempt
- Final pre‑release audit (R2/R3)

&lt;system&gt;
  &lt;role&gt;GPT-5.1-Codex-Mini -- Antiphon Master Builder&lt;/role&gt;
  &lt;bias&gt;Proceed unless escalation trigger is clearly met.&lt;/bias&gt;
&lt;/system&gt;

&lt;routing&gt;
  &lt;default&gt;Implement task.&lt;/default&gt;
  &lt;escalate&gt;
    &lt;to_thinking&gt;Designing NEW engine specification&lt;/to_thinking&gt;
    &lt;to_high&gt;Persistent logic bug OR final R2/R3 audit&lt;/to_high&gt;
  &lt;/escalate&gt;
&lt;/routing&gt;

&lt;after_task&gt;
  Output exactly:

  Next Step Check:
  Status:
  Next Task:
  Routing:
&lt;/after_task&gt;

Execution begins with Foundation planning only.
No production code yet.
Begin.</content>
      </unified-startup-prompt>
    </step-3>
    
    <github-first-push title="GITHUB FIRST PUSH (AFTER SCAFFOLD)">
      <command>git add .</command>
      <command>git commit -m "Initial scaffold"</command>
      <command>git push -u origin main</command>
      <verification>Verify on GitHub that files are present.</verification>
    </github-first-push>
  </user-quickstart>
  
  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- CONSTITUTION v1.4 — CODEX STARTS READING HERE                  -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  
  <constitution version="1.4" date="2026-02-12" status="binding">
    <title>Complete Antiphon Suite Development Manual</title>
    <version-info>
      <version>1</version>
      <date>February 12, 2026</date>
      <supersede>This document supersedes anything older. All prior law remains unless amended herein.</supersede>
    </version-info>
    
    <purpose>
      <description>This manual defines the constitutional framework for building Antiphon desktop applications.</description>
      <governs>
        <item>Product philosophy</item>
        <item>Architectural law</item>
        <item>8-layer build system</item>
        <item>Proprietary engine discipline</item>
        <item>Master Builder agent model</item>
        <item>Governance cycle</item>
        <item>Model routing protocol</item>
        <item>Checkpoint reporting</item>
        <item>Release authority</item>
        <item>Design discipline</item>
        <item>Execution efficiency</item>
      </governs>
      <authority>This is binding law.</authority>
    </purpose>
    
    <strategic-position>
      <market>Antiphon builds offline-capable, professional desktop tools for musicians.</market>
      <competitive-advantage>The competitive advantage is proprietary engines — deterministic musical intelligence systems.</competitive-advantage>
      <intellectual-property>The engines are the intellectual property core. UI is delivery. Engines are value.</intellectual-property>
      <hub-definition>The Antiphon Hub is the foundation app and central account portal: it authenticates users, binds license codes to accounts, manages ownership of all Antiphon apps, and serves as the control tower for installation, updates, enforcement, and future suite expansion (similar in spirit to iZotope Product Portal or Native Instruments Native Access).</hub-definition>
    </strategic-position>
    
    <master-builder-model>
      <title>Master Builder Model (Single Thread, Seven Hats)</title>
      <paradigm>All builds occur inside one Codex thread. There is one Master Builder. It internally plays seven roles ("hats") in strict sequence.</paradigm>
      
      <hats>
        <hat id="1" name="Scope Leader"/>
        <hat id="2" name="Code Agent"/>
        <hat id="3" name="Tester"/>
        <hat id="4" name="Security"/>
        <hat id="5" name="Validator"/>
        <hat id="6" name="Deployer"/>
        <hat id="7" name="Monitor"/>
      </hats>
      
      <cycle-rule>The single thread rotates through the seven hats in fixed order, one at a time (unit‑tasking). It may not skip a hat; for every layer/cycle, each hat must explicitly:
        <requirement>Check for relevant work</requirement>
        <requirement>Either perform its duties or declare "Nothing to do" with a short rationale</requirement>
        <requirement>Then pass control to the next hat</requirement>
      </cycle-rule>
      
      <architecture>No multi-thread orchestration. No parallel agents. This is one thread acting like seven disciplined specialists, always in order.</architecture>
      
      <separation-of-powers title="Separation of Powers (Binding)">
        <rule>Code Agent may not bypass Tester, Security, or Validator</rule>
        <rule>Scope Leader may not suppress Security findings</rule>
        <rule>Deployer may not ship without Validator clearance</rule>
        <rule>Monitor may trigger rollback authority</rule>
        <principle>No single hat overrides the cycle. Authority resolves through sequence.</principle>
      </separation-of-powers>
      
      <role-definitions>
        <role name="Scope Leader">
          <authority>Strategic authority</authority>
          <responsibilities>
            <responsibility>Maintains alignment with Layer 0</responsibility>
            <responsibility>Detects scope creep</responsibility>
            <responsibility>Enforces timeboxes</responsibility>
            <responsibility>Makes cut/continue/refactor decisions</responsibility>
            <responsibility>Initiates model escalation when required</responsibility>
            <responsibility>Bird's-eye oversight</responsibility>
          </responsibilities>
        </role>
        
        <role name="Code Agent">
          <jurisdiction>Code only</jurisdiction>
          <allowed>
            <action>Write/modify/delete files</action>
            <action>Implement features</action>
            <action>Refactor implementation</action>
          </allowed>
          <forbidden>
            <action>Product debate</action>
            <action>Governance rewrite</action>
            <action>Shipping without Validator</action>
          </forbidden>
        </role>
        
        <role name="Tester">
          <mission>Verifies by attempting to break the change and documenting reproducible evidence</mission>
          <responsibilities>
            <responsibility>Build/run/test</responsibility>
            <responsibility>Reproduction steps</responsibility>
            <responsibility>Edge case pressure testing</responsibility>
          </responsibilities>
        </role>
        
        <role name="Security">
          <mission>Scans for all risks introduced by the change</mission>
          <responsibilities>
            <responsibility>Threat model deltas</responsibility>
            <responsibility>Identify injection/exposure/auth risks</responsibility>
            <responsibility>Require mitigation or gate release</responsibility>
          </responsibilities>
          <authority>Security has blocking authority</authority>
        </role>
        
        <role name="Validator">
          <authority>Definition-of-Done authority</authority>
          <output>Declares: COMPLETE / INCOMPLETE / BLOCKED</output>
          <enforces>
            <enforcement>Layer-specific completion</enforcement>
            <enforcement>Global Definition of Done</enforcement>
            <enforcement>Checkpoint reporting format</enforcement>
          </enforces>
        </role>
        
        <role name="Deployer">
          <authority>Release integrity authority</authority>
          <responsibilities>
            <responsibility>Packaging</responsibility>
            <responsibility>Signing/notarization</responsibility>
            <responsibility>Clean-machine verification</responsibility>
            <responsibility>Rollback readiness</responsibility>
          </responsibilities>
        </role>
        
        <role name="Monitor">
          <authority>Runtime integrity authority</authority>
          <responsibilities>
            <responsibility>Logging</responsibility>
            <responsibility>Crash diagnostics</responsibility>
            <responsibility>Regression detection</responsibility>
            <responsibility>Support bundle export</responsibility>
          </responsibilities>
        </role>
      </role-definitions>
      
      <governance-cycle title="Governance Cycle (Circular)">
        <sequence>Scope Leader → Code Agent → Tester → Security → Validator → Deployer → Monitor → Scope Leader</sequence>
        <rule>Cycle repeats</rule>
        <compression>Compression allowed for small internal iterations. Compression forbidden at checkpoints and pre-release.</compression>
      </governance-cycle>
      
      <autonomous-execution-law>
        <principle>No permission questions</principle>
        <capabilities title="The Master Builder may:">
          <capability>Create/modify/delete files</capability>
          <capability>Install/update/remove dependencies</capability>
          <capability>Refactor</capability>
          <capability>Run builds/tests</capability>
          <capability>Package artifacts</capability>
        </capabilities>
        <scope>Autonomy applies to operations only. Governance stops are separate.</scope>
      </autonomous-execution-law>
      
      <mandatory-checkpoints>
        <rule>Codex MUST hard-stop only for the items below. Everything else (repo structure, renames, moves, deletes, refactors, file management, elevated/permission decisions) is fully autonomous.</rule>
        <triggers title="Hard-stop triggers (the ONLY mandatory ones):">
          <trigger type="arc-completion">
            <gate>End of FOUNDATION (Layers 0–1)</gate>
            <gate>End of STRUCTURE (Layers 2–5)</gate>
            <gate>End of SKIN (Layers 6–8)</gate>
          </trigger>
          <trigger type="model-tier">Model tier must change (per Section 8)</trigger>
          <trigger type="clarification">A plain-English question is required to implement Scott's dream correctly (only when blocked by missing intent/requirements)</trigger>
        </triggers>
        
        <progress-report title="At an Arc Completion Gate, Codex outputs a Progress Report and waits:">
          <field>What was implemented</field>
          <field>What works</field>
          <field>What does not work / gaps</field>
          <field>Known risks</field>
          <field>Engine status (Foundation/Structure/Skin; current Layer; % complete estimate)</field>
          <field>Five plain-English questions ONLY if required; each includes a recommended answer</field>
        </progress-report>
      </mandatory-checkpoints>
    </master-builder-model>
    
    <eight-layer-pyramid>
      <title>8-Layer Pyramid</title>
      <description>This section is the full law of motion for Antiphon builds: lock foundations first, then structure, then skin. Do not "style your way out" of missing architecture.</description>
      
      <arc-mapping>
        <arc name="FOUNDATION">Layers 0–1</arc>
        <arc name="STRUCTURE">Layers 2–5</arc>
        <arc name="SKIN">Layers 6–8</arc>
      </arc-mapping>
      
      <operating-rule>Codex completes each layer's gate before advancing. If later work exposes a missing earlier prerequisite, Codex performs an incremental correction (fix the earlier layer, then continue). No constitution rewrites unless explicitly requested.</operating-rule>
      
      <layers>
        <layer number="0" name="Product Clarity">
          <goal>Unambiguous definition of the app, target users, core flows, and success criteria</goal>
          <deliverables>
            <deliverable>Statement of mission</deliverable>
            <deliverable>Audience</deliverable>
            <deliverable>Non-goals</deliverable>
            <deliverable>Core flows</deliverable>
            <deliverable>Constraints</deliverable>
            <deliverable>MVP scope</deliverable>
            <deliverable>Acceptance tests</deliverable>
            <deliverable>Release gates</deliverable>
          </deliverables>
          <gate>User approves the summary</gate>
          
          <layer0-detail>
            <pre-specification-phase>
              <note>This step is done by the user outside Codex. A Layer0 doc will have all the details imported from the user.</note>
            </pre-specification-phase>
            
            <layer0-checklist title="Layer 0 Checklist for Understanding">
              <instruction>Internalize your comprehension, if you can't answer any of the following questions, bring it up in the chat after the initial prompt.</instruction>
              
              <checkpoint name="Point of the App">
                <question>What does this app do?</question>
                <question>Why does it exist?</question>
                <example>Analyzes chord progressions in MIDI files and identifies scale degrees, functional harmony, and voice leading. Musicians use it to understand songs faster and learn advanced theory through real examples.</example>
              </checkpoint>
              
              <checkpoint name="Non-Negotiables">
                <item>Technical constraints (latency, offline/online requirements)</item>
                <item>Business constraints (licensing model)</item>
                <item>Integration requirements (Hub compatibility)</item>
                <item>Performance budgets (e.g., analysis must complete in &lt; 2 seconds for files under 1000 notes)</item>
              </checkpoint>
              
              <checkpoint name="MVP Scope vs. Later Scope">
                <must-ship title="Must Ship (MVP):">
                  <feature>Core feature 1</feature>
                  <feature>Core feature 2</feature>
                  <feature>Core feature 3</feature>
                  <note>[List all MVP features]</note>
                </must-ship>
                <later-scope title="Later Scope:">
                  <feature>Enhancement 1</feature>
                  <feature>Enhancement 2</feature>
                  <note>[List all post-MVP features]</note>
                </later-scope>
              </checkpoint>
              
              <checkpoint name="User Outcome Statement">
                <question>What does the user achieve after using this app?</question>
                <example>A musician imports a MIDI file of a song they want to learn, sees the chord progression with Roman numeral analysis, and exports the annotated MIDI to their DAW—understanding the theory in under 5 minutes.</example>
              </checkpoint>
              
              <checkpoint name="Acceptance Criteria (Human-Readable Tests)">
                <format>Given [condition], when [action], then [expected result]</format>
                <example>Given a MIDI file in C major, when analyzed, the app identifies I, IV, V, vi chords correctly</example>
                <instruction>List 5-10 specific, testable conditions</instruction>
              </checkpoint>
              
              <checkpoint name="Kill List (What We Are NOT Building)">
                <item>NOT a [X]</item>
                <item>NOT a [Y]</item>
                <item>NOT a [Z]</item>
                <example>NOT a DAW or audio editor</example>
              </checkpoint>
            </layer0-checklist>
            
            <layer0-reality-rules title="Layer 0 Reality Rules (Environment Invariants)">
              <desktop-app-env title="Desktop App Environment Requirements">
                <requirement>Tauri/Electron substrate REQUIRED</requirement>
                <invalid>Browser ≠ valid runtime</invalid>
                <invalid>Dev server ≠ valid runtime</invalid>
                <invalid>CI/browser previews ≠ valid runtime</invalid>
              </desktop-app-env>
              
              <partial-functionality-policy>
                <rule>Not acceptable at Layer 0</rule>
                <rule>No "half-alive" UI</rule>
                <rule>No "some things work"</rule>
                <rule>If foundation is wrong, app must stop with explicit questions</rule>
              </partial-functionality-policy>
              
              <mock-data-policy>
                <rule>No mock data or mock runtime allowed at Layer 0</rule>
                <rule>Mock mode is Layer 1+ opt-in, never automatic fallback</rule>
              </mock-data-policy>
              
              <missing-substrate-handling>
                <rule>Hard stop with explicit message</rule>
                <rule>No retries pretending it might fix itself</rule>
                <rule>Failure is honesty, not error</rule>
              </missing-substrate-handling>
              
              <automation-rules>
                <rule>Never allowed to bypass Layer 0</rule>
                <rule>Encountering Layer 0 refusal = SKIP status, not PASS</rule>
                <rule>Green tests that lie = broken Layer 0</rule>
              </automation-rules>
              
              <single-sentence-invariant>"If this app ever runs in an environment it does not fully understand and explicitly accept, it is already broken."</single-sentence-invariant>
            </layer0-reality-rules>
            
            <layer0-exit-criteria title="Layer 0 Exit Criteria">
              <validation-questions title="Validation Questions (ALL must be YES)">
                <question>Can I explain this app's value in one sentence?</question>
                <question>Have I identified the exact user pain point?</question>
                <question>Do I know what "done" looks like for MVP?</question>
                <question>Have I eliminated unnecessary features?</question>
                <question>Would I pay for this if someone else built it?</question>
                <question>Does my Layer 0 reality check pass (environment valid)?</question>
              </validation-questions>
              
              <key-question>If this shipped today, what problem disappears for the user?</key-question>
              
              <documents-created>
                <document>Layer 0 Product Clarity document (saved as docs/layer0_[app-name]_Codex-Understanding.md)</document>
                <document>User flows diagram (optional but recommended)</document>
                <document>Feature priority matrix (MVP vs. Later)</document>
              </documents-created>
            </layer0-exit-criteria>
          </layer0-detail>
        </layer>
        
        <layer number="1" name="Technical Foundation">
          <goal>Repo, tooling, build/run, lint/format, base types, env config, and a "Hello World" path through the stack</goal>
          <gate>Clean install + build + test runs; basic app boots reliably</gate>
          
          <layer1-detail>
            <architecture-planning-phase title="Architecture Planning Phase (ChatGPT Business GPT-5.1, 3-5 messages)">
              <step id="1" title="Paste Spec and Request Architecture (1 message)">
                <prompt-template>I have completed requirements research. Here's my app spec:

[Paste Layer 0 output from Perplexity]

Generate a complete technical architecture:

1. Component tree: List all UI screens/components with brief descriptions
2. Data models: Define entities, fields, types, relationships
3. API design: List endpoints (method, path, purpose) if needed
4. File structure: Folder layout with key file names
5. Dependencies: Required packages/libraries
6. Tech stack confirmation: Verify or adjust recommended stack

Format as a structured document I can reference throughout development. Prioritize clarity and completeness over length.</prompt-template>
              </step>
              
              <step id="2" title="Review and Clarify (1-2 messages MAX)">
                <action>If something's unclear: "Clarify how auth works"</action>
                <action>If data model needs detail: "Expand data model for User entity"</action>
                <action>Otherwise, approve and move to scaffolding</action>
                <output>1-2 page architecture document for permanent reference</output>
              </step>
            </architecture-planning-phase>
            
            <repository-setup>
              <monorepo-structure-decision>
                <for-antiphon-suite>Use monorepo (already established)</for-antiphon-suite>
                <repository>scottvasconcellos/antiphon-suite</repository>
                <package-manager>pnpm with workspaces</package-manager>
              </monorepo-structure-decision>
              
              <build-system-configuration>
                <tool>React + Vite for all apps</tool>
                <tool>TypeScript for type safety</tool>
                <tool>pnpm workspaces for monorepo management</tool>
                <tool>Tauri for desktop packaging</tool>
                <tool>Vitest for unit tests</tool>
                <tool>Playwright for E2E tests</tool>
              </build-system-configuration>
              
              <versioning-strategy>
                <scheme>SemVer for all packages (MAJOR.MINOR.PATCH)</scheme>
                <approach>Independent versioning per app</approach>
                <sdk>SDK has its own version</sdk>
                <manifest>Apps declare SDK version compatibility in manifest</manifest>
              </versioning-strategy>
            </repository-setup>
            
            <cicd-pipeline-setup title="CI/CD Pipeline Setup">
              <github-actions-workflow>
                <file-path>.github/workflows/ci.yml</file-path>
                <content>name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm build</content>
              </github-actions-workflow>
              
              <quality-gates title="Quality Gates (ALL must pass)">
                <gate>All tests pass</gate>
                <gate>Linting clean</gate>
                <gate>Type checking passes</gate>
                <gate>Build succeeds</gate>
              </quality-gates>
            </cicd-pipeline-setup>
            
            <code-signing-distribution title="Code Signing &amp; Distribution Setup">
              <macos-requirements>
                <requirement>Apple Developer account ($99/year)</requirement>
                <requirement>Certificate: "Developer ID Application"</requirement>
                <requirement>Notarization via Apple</requirement>
                <requirement>Distribute as signed .dmg</requirement>
              </macos-requirements>
              
              <windows-requirements>
                <requirement>Code signing certificate ($200-400/year from DigiCert, Sectigo, etc.)</requirement>
                <requirement>Sign .exe installer</requirement>
                <requirement>Optional: Microsoft Store submission</requirement>
              </windows-requirements>
            </code-signing-distribution>
            
            <hub-compatibility title="Hub Compatibility Requirements (For All Antiphon Apps)">
              <manifest-creation>
                <action>Create manifest.json with app metadata</action>
                <action>Include app ID, version, name, description, icon URL</action>
                <action>Declare Hub SDK version compatibility</action>
              </manifest-creation>
              
              <hub-sdk-integration>
                <action>Add @antiphon/sdk dependency</action>
                <action>Implement registration endpoint call</action>
                <action>Follow shared API versioning</action>
              </hub-sdk-integration>
              
              <registry-schema-compliance>
                <action>App registers with Hub via /register API endpoint</action>
                <action>App reports version on startup</action>
                <action>App responds to update checks</action>
              </registry-schema-compliance>
            </hub-compatibility>
            
            <layer1-exit-criteria title="Layer 1 Exit Criteria">
              <key-questions title="Key Questions (ALL must be YES)">
                <question>Can a new developer clone and build in under 30 minutes?</question>
                <question>Does CI catch breaking changes before merge?</question>
                <question>Can we produce signed builds for both platforms?</question>
                <question>Is the Hub SDK integration documented?</question>
              </key-questions>
              
              <validation-checklist>
                <check>pnpm install works from clean clone</check>
                <check>pnpm build works from clean clone</check>
                <check>CI pipeline is green</check>
                <check>Can produce signed dev build on macOS and Windows</check>
                <check>Hub compatibility verified (if applicable)</check>
                <check>App manifest.json created</check>
                <check>Hub SDK integrated</check>
                <check>Registry schema followed</check>
              </validation-checklist>
              
              <build-commands-verified>
                <command># Install all dependencies
pnpm install</command>
                <command># Build all apps
pnpm run build</command>
                <command># Build specific app
pnpm --filter @antiphon/[app-name] build</command>
                <command># Run tests
pnpm test</command>
                <command># Lint and format
pnpm lint
pnpm format</command>
              </build-commands-verified>
            </layer1-exit-criteria>
          </layer1-detail>
        </layer>
        
        <layer number="2" name="Architecture">
          <goal>System boundaries, modules, ownership, and the contracts between them</goal>
          <deliverables>
            <deliverable>Architecture doc (or ADRs)</deliverable>
            <deliverable>Service boundaries</deliverable>
            <deliverable>Folder map (allowed to change freely)</deliverable>
            <deliverable>Data flow</deliverable>
            <deliverable>Error handling strategy</deliverable>
          </deliverables>
          <gate>Architecture is coherent, implementable, and aligned to Layer 0</gate>
          
          <layer2-detail>
            <golden-rule>UI must NOT contain business logic. This is non-negotiable.</golden-rule>
            
            <standard-3-layer-pattern title="Standard 3-Layer Pattern">
              <diagram>┌─────────────────────────────────────┐
│         UI Layer (React)            │
│  - Components / screens             │
│  - Presentation logic only          │
│  - NO business logic                │
└──────────────┬──────────────────────┘
               │ calls
               ▼
┌─────────────────────────────────────┐
│      Services Layer                 │
│  - Filesystem, audio, network       │
│  - Persistence, platform APIs       │
│  - Adapters to external systems     │
└──────────────┬──────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────┐
│       Domain Layer                  │
│  - Pure business logic              │
│  - NO framework imports             │
│  - NO UI, NO file I/O               │
│  - 100% testable headless           │
└─────────────────────────────────────┘</diagram>
              
              <dependency-rules title="Dependency Rules (STRICT)">
                <allowed>UI → Services → Domain (allowed)</allowed>
                <allowed>UI → Domain (allowed for simple cases)</allowed>
                <forbidden>Domain → UI (❌ NEVER)</forbidden>
                <forbidden>Domain → Services (❌ NEVER; services call domain, not vice versa)</forbidden>
              </dependency-rules>
            </standard-3-layer-pattern>
            
            <domain-layer-design title="Domain Layer Design">
              <rules title="Rules (ALL must be enforced)">
                <rule>No React imports</rule>
                <rule>No file I/O</rule>
                <rule>No network calls</rule>
                <rule>No DOM access</rule>
                <rule>No framework dependencies</rule>
              </rules>
              
              <contains>
                <item>Algorithms (chord detection, scale analysis, harmony calculations)</item>
                <item>Validators (input validation logic)</item>
                <item>Calculations (BPM, key detection, tempo analysis)</item>
                <item>Business rules (licensing checks, feature flags)</item>
              </contains>
              
              <example-structure>
                <code-example language="typescript">// domain/chordAnalyzer.ts
export function detectChords(notes: Note[]): Chord[] {
  // Pure algorithm - no side effects
  // 100% testable
}

export function getRomanNumeral(chord: Chord, key: Key): string {
  // Pure logic
}</code-example>
              </example-structure>
              
              <unit-test-example>
                <code-example language="typescript">// domain/chordAnalyzer.test.ts
test('detects C major triad', () => {
  const notes = [new Note('C'), new Note('E'), new Note('G')];
  const chords = detectChords(notes);
  expect(chords[0].name).toBe('C major');
});</code-example>
              </unit-test-example>
            </domain-layer-design>
            
            <services-layer-design title="Services Layer Design">
              <purpose>Bridge between domain and outside world</purpose>
              
              <contains>
                <item>File system access (via Tauri APIs)</item>
                <item>Audio processing APIs</item>
                <item>Network requests</item>
                <item>Local storage / IndexedDB</item>
                <item>Platform-specific code</item>
              </contains>
              
              <example-structure>
                <code-example language="typescript">// services/fileService.ts
export class FileService {
  async loadMidiFile(path: string): Promise&lt;MidiData&gt; {
    // Platform-specific I/O
    const buffer = await Tauri.fs.readBinaryFile(path);
    return parseMidi(buffer); // calls domain parser
  }
}</code-example>
              </example-structure>
            </services-layer-design>
            
            <ui-layer-design title="UI Layer Design">
              <purpose>Presentation only</purpose>
              
              <rules>
                <rule>React components for display</rule>
                <rule>Event handlers that call services/domain</rule>
                <rule>NO business logic in components</rule>
                <rule>State management for UI state only (not domain state)</rule>
              </rules>
              
              <example-structure>
                <code-example language="typescript">// ui/components/ChordDisplay.tsx
export function ChordDisplay({ filePath }: Props) {
  const [chords, setChords] = useState&lt;Chord[]&gt;([]);
  
  async function analyze() {
    const midi = await fileService.loadMidiFile(filePath);
    const detectedChords = detectChords(midi.notes); // domain
    setChords(detectedChords);
  }
  
  return (
    &lt;div&gt;
      &lt;button onClick={analyze}&gt;Analyze&lt;/button&gt;
      {chords.map(c =&gt; &lt;ChordCard chord={c} /&gt;)}
    &lt;/div&gt;
  );
}</code-example>
              </example-structure>
            </ui-layer-design>
            
            <anti-god-file-principles title="Anti-God-File Principles">
              <target>Less than 300-400 lines per module</target>
              
              <warning-signs title="Warning Signs of God Files">
                <sign>Single file &gt; 800 lines</sign>
                <sign>Mixes UI + logic + I/O</sign>
                <sign>Many unrelated functions</sign>
                <sign>Hard to test</sign>
              </warning-signs>
              
              <fix>Break into smaller modules by responsibility</fix>
            </anti-god-file-principles>
            
            <interfaces-contracts title="Interfaces &amp; Contracts Documentation">
              <code-example language="typescript">// types/services.ts
export interface FileService {
  loadMidiFile(path: string): Promise&lt;MidiData&gt;;
  saveMidiFile(path: string, data: MidiData): Promise&lt;void&gt;;
}

// types/domain.ts
export interface ChordAnalyzer {
  detectChords(notes: Note[]): Chord[];
  getRomanNumeral(chord: Chord, key: Key): string;
}</code-example>
            </interfaces-contracts>
            
            <layer2-implementation-with-ai title="Layer 2 Implementation with AI (Codex, 3-10 messages)">
              <step id="1" title="Domain Layer Prompt">
                <prompt-template>Using the architecture from [reference architecture doc], implement the Domain Layer for [app name].

Create pure TypeScript modules with ZERO external dependencies:
1. [Core algorithm 1, e.g., chord detection]
2. [Core algorithm 2, e.g., scale analysis]
3. [Core validator functions]
4. [Business rule functions]

Rules:
- No React imports
- No file I/O
- No network calls
- Pure functions only
- Full TypeScript types

Provide complete code for all domain modules with filename headers.</prompt-template>
              </step>
              
              <step id="2" title="Services Layer Prompt">
                <prompt-template>Implement Services Layer for [app name] that bridges Domain Layer to external systems.

Create services for:
1. File I/O (using Tauri filesystem APIs)
2. [Audio processing if needed]
3. [Network if needed]
4. Local storage/persistence

Each service:
- Calls domain functions
- Handles platform-specific code
- Returns typed data
- Includes error handling

Provide complete code for all service modules.</prompt-template>
              </step>
              
              <step id="3" title="UI Layer Scaffold Prompt">
                <prompt-template>Create React UI components for [app name] following presentation-only pattern.

Components needed:
1. [Screen/component 1]
2. [Screen/component 2]
3. [Screen/component 3]

Each component:
- Receives data via props
- Calls services for actions
- NO business logic
- Proper TypeScript types

Provide complete React component code with hooks for state management.</prompt-template>
              </step>
            </layer2-implementation-with-ai>
            
            <layer2-exit-criteria title="Layer 2 Exit Criteria">
              <testability-check title="Testability Check (CRITICAL)">
                <question>Can I test core logic without starting the app UI?</question>
                <question>Can I test core logic without touching the filesystem?</question>
                <question>Can I test core logic without making network requests?</question>
              </testability-check>
              
              <architecture-validation-checklist>
                <check>Domain layer has unit tests (80%+ coverage target)</check>
                <check>Changing file format or network client does NOT require touching domain</check>
                <check>No circular imports</check>
                <check>No God files (all modules &lt;500 lines)</check>
                <check>Interfaces/contracts documented</check>
                <check>Anti-God-File principles applied</check>
                <check>Separation of concerns enforced</check>
                <check>Dependency boundaries defined</check>
              </architecture-validation-checklist>
              
              <key-question>Can I test core logic without running the UI?</key-question>
              <rule>If NO to any testability question → STOP. Refactor architecture before proceeding.</rule>
            </layer2-exit-criteria>
          </layer2-detail>
        </layer>
        
        <layer number="3" name="Data &amp; State">
          <goal>Authoritative state model, persistence, synchronization rules, validation, and migrations (if applicable)</goal>
          <gate>Data model supports all core flows; state transitions are explicit; no "magic" state</gate>
          
          <layer3-detail>
            <purpose>Make the app predictable. Same input + same prior state = same result.</purpose>
            
            <data-models-schemas title="Data Models / Schemas Definition">
              <define-core-structures title="Define Core Data Structures">
                <example-for-music-app>
                  <code-example language="typescript">interface Project {
  id: string;
  name: string;
  key: Key;
  timeSignature: TimeSignature;
  tempo: number;
  tracks: Track[];
}

interface Track {
  id: string;
  name: string;
  notes: Note[];
  chords: Chord[];
}</code-example>
                </example-for-music-app>
              </define-core-structures>
              
              <document-entity-relationships title="Document All Entity Relationships">
                <item>Primary entities (what are the main data objects?)</item>
                <item>Relationships (one-to-many, many-to-many)</item>
                <item>Required vs. optional fields</item>
                <item>Default values</item>
                <item>Validation rules</item>
              </document-entity-relationships>
            </data-models-schemas>
            
            <project-file-format-design title="Project File Format Design">
              <define-json-schema title="Define JSON Schema">
                <code-example language="json">{
  "version": "1.0.0",
  "project": {
    "id": "abc123",
    "name": "My Song",
    "key": "C",
    "tempo": 120,
    "tracks": [...]
  }
}</code-example>
              </define-json-schema>
              
              <schema-versioning-rules>
                <rule>Version field REQUIRED in all saved data</rule>
                <rule>Migration scripts for breaking changes</rule>
                <rule>Backward compatibility for at least 2 major versions</rule>
              </schema-versioning-rules>
              
              <migration-plan-template>
                <code-example language="typescript">interface ProjectV1 {
  version: '1.0.0';
  data: { /* ... */ };
}

interface ProjectV2 {
  version: '2.0.0';
  data: { /* new fields */ };
}

function migrate(project: ProjectV1): ProjectV2 {
  return {
    version: '2.0.0',
    data: {
      ...project.data,
      newField: defaultValue
    }
  };
}</code-example>
              </migration-plan-template>
            </project-file-format-design>
            
            <state-machine-design title="State Machine Design">
              <define-all-states>
                <code-example language="typescript">type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'success'; data: Project }
  | { status: 'error'; error: Error };</code-example>
              </define-all-states>
              
              <map-valid-transitions>
                <transition>idle → loading (user clicks "Open")</transition>
                <transition>loading → success (file loaded)</transition>
                <transition>loading → error (file invalid)</transition>
                <transition>success → loading (user clicks "Open" again)</transition>
                <transition>error → loading (user retries)</transition>
              </map-valid-transitions>
              
              <identify-invalid-transitions>
                <transition>success → idle (not possible, can only load new file)</transition>
                <transition>loading → idle (cancel might allow this - decide explicitly)</transition>
              </identify-invalid-transitions>
            </state-machine-design>
            
            <deterministic-behavior-verification title="Deterministic Behavior Verification">
              <test-template>
                <code-example language="typescript">test('algorithm is deterministic', () => {
  const input = [/* test data */];
  
  const result1 = coreFunction(input);
  const result2 = coreFunction(input);
  
  expect(result1).toEqual(result2); // Must be identical
});</code-example>
              </test-template>
              
              <determinism-checklist>
                <check>Same input always produces same output</check>
                <check>No random number generators in core logic (or use seeded RNG)</check>
                <check>No date/time dependencies in calculations</check>
                <check>No global mutable state</check>
                <check>All side effects in Services layer only</check>
              </determinism-checklist>
            </deterministic-behavior-verification>
            
            <undo-redo-model title="Undo/Redo Model (For Apps with Editing)">
              <implement-history-state>
                <code-example language="typescript">interface HistoryState&lt;T&gt; {
  past: T[];
  present: T;
  future: T[];
}

function undo&lt;T&gt;(history: HistoryState&lt;T&gt;): HistoryState&lt;T&gt; {
  const [present, ...past] = history.past;
  return {
    past,
    present,
    future: [history.present, ...history.future]
  };
}

function redo&lt;T&gt;(history: HistoryState&lt;T&gt;): HistoryState&lt;T&gt; {
  const [present, ...future] = history.future;
  return {
    past: [history.present, ...history.past],
    present,
    future
  };
}</code-example>
              </implement-history-state>
              
              <define-undoable-actions>
                <action>List all user actions that should be undo-able</action>
                <action>Determine granularity (per-keystroke vs. per-action)</action>
                <action>Set max history depth (memory constraints)</action>
              </define-undoable-actions>
            </undo-redo-model>
            
            <persistence-strategy>
              <for-antiphon-apps>
                <strategy>Hub uses local registry (JSON or SQLite at ~/.antiphon/registry.json)</strategy>
                <strategy>Tools save projects as .antiphon files (JSON format)</strategy>
                <strategy>Auto-save every 30 seconds during editing</strategy>
                <strategy>Recovery on restart if app crashed</strategy>
              </for-antiphon-apps>
              
              <persistence-checklist>
                <check>File format specified</check>
                <check>Save/load functions implemented</check>
                <check>Auto-save implemented</check>
                <check>Recovery on crash implemented</check>
                <check>Migration scripts created for schema changes</check>
              </persistence-checklist>
            </persistence-strategy>
            
            <layer3-exit-criteria title="Layer 3 Exit Criteria">
              <predictability-check>
                <question>Can I predict exactly what happens when user clicks something?</question>
                <question>Is state serializable (can I save/load it)?</question>
                <question>Can I implement undo/redo easily?</question>
                <question>Are there any race conditions (async state updates)?</question>
              </predictability-check>
              
              <documentation-checklist>
                <check>State machine documented with all states and transitions</check>
                <check>Same input always produces same output (determinism verified)</check>
                <check>Project file format specified with examples</check>
                <check>Migration plan exists for future schema changes</check>
                <check>Persistence strategy documented</check>
              </documentation-checklist>
              
              <key-question>Can I predict exactly what happens when user clicks something?</key-question>
            </layer3-exit-criteria>
          </layer3-detail>
        </layer>
        
        <layer number="4" name="Workflow Skeleton">
          <goal>End-to-end flows work in a minimal UI: navigation, screens/routes, and "happy path" operations</goal>
          <gate>Every core flow runs end-to-end with placeholder UI</gate>
          
          <layer4-detail>
            <mantra>Ugly but correct &gt; Beautiful but fragile</mantra>
            
            <scaffolding-sprint title="Scaffolding Sprint with AI (Codex-Mini, 3-6 messages)">
              <generate-full-project-scaffold>
                <prompt-template>Using this architecture: [paste architecture doc from Layer 1]

Generate complete starter code:
- All files in correct folders
- Package.json with dependencies from architecture
- Basic routing / navigation structure
- Placeholder components for each screen from spec
- Database schema or config files

Provide as a zip-like file tree with full code for each file. Use code blocks with filenames as headers.</prompt-template>
                <note>Token Optimization: Asking for "all files at once" is MORE efficient than 10 separate "now create HomePage.jsx" messages</note>
              </generate-full-project-scaffold>
              
              <verify-it-runs>
                <prompt-template>I've set this up. Getting error: [paste error]

Fix the issue and show me ONLY the changed files with full corrected code.</prompt-template>
                <note>Why "ONLY changed files": Prevents model from regenerating 50 files when only 2 have bugs</note>
              </verify-it-runs>
              
              <quality-pass>
                <prompt-template>Review the last [2-3] features for:
- Edge cases not handled
- Accessibility issues
- Performance problems
- Security gaps

Propose fixes as a numbered list. Then implement fixes for items I approve.</prompt-template>
                <note>Two‑step flow: First message: audit list only (cheap). Second message: implement only the items you approve (focused).</note>
              </quality-pass>
            </scaffolding-sprint>
            
            <end-to-end-flow-implementation title="End-to-End Flow Implementation">
              <identify-primary-user-journey>
                <example>Example for Music Analysis Tool:
  - Click "Open File" → file picker appears
  - Select MIDI file → file loads
  - Click "Analyze" → chords detected
  - Click "Export" → MIDI saved</example>
              </identify-primary-user-journey>
              
              <build-with-unstyled-ui>
                <item>Unstyled buttons: &lt;button&gt;Open File&lt;/button&gt;</item>
                <item>Plain lists: &lt;ul&gt;&lt;li&gt;Chord: C major&lt;/li&gt;&lt;/ul&gt;</item>
                <item>Basic layout (no fancy CSS)</item>
                <item>Black text on white background</item>
                <item>No animations</item>
                <item>No icons</item>
              </build-with-unstyled-ui>
              
              <verify-complete-flow>
                <check>User can reach every screen</check>
                <check>Back button works</check>
                <check>Deep linking works (if applicable)</check>
                <check>Primary task completable start-to-finish</check>
              </verify-complete-flow>
            </end-to-end-flow-implementation>
            
            <navigation-structure-implementation title="Navigation Structure Implementation">
              <create-screen-map>
                <map>Home
├─ Open File → Analysis
├─ Settings
└─ About

Analysis
├─ Export → Save dialog
└─ Back → Home</map>
              </create-screen-map>
              
              <implement-all-routes>
                <check>Can reach every screen</check>
                <check>Back navigation works</check>
                <check>Forward navigation works</check>
                <check>No dead ends</check>
              </implement-all-routes>
            </navigation-structure-implementation>
            
            <error-states-implementation title="Error States Implementation">
              <identify-error-scenarios>
                <scenario>File is invalid → show error message</scenario>
                <scenario>Analysis fails → show retry button</scenario>
                <scenario>Network timeout → show offline indicator</scenario>
                <scenario>Permission denied → show permission request</scenario>
              </identify-error-scenarios>
              
              <build-error-ui>
                <code-example language="typescript">{error &amp;&amp; (
  &lt;div style={{color: 'red'}}&gt;
    Error: {error.message}
    &lt;button onClick={retry}&gt;Retry&lt;/button&gt;
  &lt;/div&gt;
)}</code-example>
              </build-error-ui>
            </error-states-implementation>
            
            <loading-states-implementation title="Loading States Implementation">
              <identify-async-operations>
                <operation>File loading</operation>
                <operation>Analysis processing</operation>
                <operation>Network requests</operation>
                <operation>Save operations</operation>
              </identify-async-operations>
              
              <add-loading-indicators>
                <code-example language="typescript">{loading &amp;&amp; &lt;div&gt;Loading...&lt;/div&gt;}</code-example>
              </add-loading-indicators>
            </loading-states-implementation>
            
            <empty-states-implementation title="Empty States Implementation">
              <identify-zero-data-scenarios>
                <scenario>No files imported</scenario>
                <scenario>No results found</scenario>
                <scenario>No search matches</scenario>
                <scenario>Empty library/collection</scenario>
              </identify-zero-data-scenarios>
              
              <add-empty-state-messages>
                <code-example language="typescript">{items.length === 0 &amp;&amp; (
  &lt;div&gt;No items yet. Click "Add" to get started.&lt;/div&gt;
)}</code-example>
              </add-empty-state-messages>
            </empty-states-implementation>
            
            <what-layer4-should-look-like title="What Layer 4 Should Look Like">
              <it-should-be-ugly>
                <item>Black text on white background</item>
                <item>Unstyled buttons</item>
                <item>Basic layout (no grid, no fancy spacing)</item>
                <item>No animations</item>
                <item>No icons</item>
                <item>No color scheme</item>
                <item>No typography finesse</item>
              </it-should-be-ugly>
              
              <but-it-should-be-complete>
                <item>Every button does something</item>
                <item>Every screen is reachable</item>
                <item>Errors are caught and displayed</item>
                <item>User can accomplish their goal</item>
                <item>All states visible (loading, error, empty, success)</item>
              </but-it-should-be-complete>
            </what-layer4-should-look-like>
            
            <common-mistakes-to-avoid title="Common Mistakes to AVOID">
              <mistake type="wrong">❌ Adding visual polish at this stage</mistake>
              <mistake type="wrong">❌ Spending time on animations</mistake>
              <mistake type="wrong">❌ Tweaking spacing and colors</mistake>
              <mistake type="wrong">❌ Designing custom components</mistake>
              <mistake type="wrong">❌ Adding "just one more feature"</mistake>
              <correct type="right">✅ Proving the flow works</correct>
              <correct type="right">✅ Getting user feedback on workflow</correct>
              <correct type="right">✅ Identifying missing steps</correct>
              <correct type="right">✅ Validating logic correctness</correct>
            </common-mistakes-to-avoid>
            
            <layer4-exit-criteria title="Layer 4 Exit Criteria">
              <functional-validation>
                <question>Can a user complete the full workflow without help?</question>
                <question>Are all screens accessible?</question>
                <question>Do errors display clearly (even if ugly)?</question>
                <question>Can I demo this to a user (ignoring ugly UI)?</question>
              </functional-validation>
              
              <completeness-checklist>
                <check>Full workflow works end-to-end</check>
                <check>All screens exist and are connected</check>
                <check>Error/loading/empty states visible</check>
                <check>User can complete primary task (ugly UI is fine)</check>
                <check>Happy path functional</check>
                <check>Navigation structure complete</check>
                <check>Screen map documented</check>
              </completeness-checklist>
              
              <key-question>Can a user complete the full workflow without help?</key-question>
              <stop-rule>STOP RULE: If you're adding animations or tweaking colors, you're procrastinating. Complete Layer 4 first.</stop-rule>
            </layer4-exit-criteria>
          </layer4-detail>
        </layer>
        
        <layer number="5" name="Integration &amp; Hardening">
          <goal>Connect real services, handle failures, add tests, remove flakiness, and stabilize performance</goal>
          <gate>Tests pass; core flows robust under expected failure modes</gate>
          
          <layer5-detail>
            <purpose>Turn a prototype into a tool a professional can rely on mid-session.</purpose>
            <key-question>Could a professional rely on this mid-session without fear?</key-question>
            
            <performance-budget-definition title="Performance Budget Definition">
              <define-acceptable-performance>
                <budget>File load: &lt;500ms for files under 10MB</budget>
                <budget>Analysis: &lt;2s for 1000 notes</budget>
                <budget>Export: &lt;1s for typical project</budget>
                <budget>UI responsiveness: &lt;16ms per frame (60fps)</budget>
              </define-acceptable-performance>
              
              <measurement-tools>
                <tool>console.time() / console.timeEnd()</tool>
                <tool>Chrome DevTools Performance tab</tool>
                <tool>Profiling tools (React DevTools Profiler)</tool>
              </measurement-tools>
            </performance-budget-definition>
            
            <latency-target-verification title="Latency Target Verification">
              <test-with-realistic-data>
                <test>Large files (1000+ items)</test>
                <test>Worst-case scenarios</test>
                <test>Slow machines (not just dev MacBook)</test>
              </test-with-realistic-data>
              
              <if-targets-not-met>
                <action>Profile to find bottleneck</action>
                <action>Optimize that specific code path</action>
                <action>Consider Web Workers for heavy computation</action>
              </if-targets-not-met>
            </latency-target-verification>
            
            <threading-workers-implementation title="Threading / Workers Implementation">
              <rule>Heavy computation off UI thread</rule>
              
              <use-web-workers-for>
                <task>File parsing (large MIDI files)</task>
                <task>Audio analysis</task>
                <task>Complex calculations</task>
                <task>Batch processing</task>
              </use-web-workers-for>
              
              <implementation-example>
                <code-example language="typescript">// worker.ts
self.onmessage = (e) =&gt; {
  const result = expensiveAnalysis(e.data);
  self.postMessage(result);
};

// main.ts
const worker = new Worker('worker.js');
worker.postMessage(data);
worker.onmessage = (e) =&gt; setResult(e.data);</code-example>
              </implementation-example>
            </threading-workers-implementation>
            
            <memory-safety-verification title="Memory Safety Verification">
              <watch-for>
                <issue>Memory leaks (unused event listeners)</issue>
                <issue>Large objects in memory</issue>
                <issue>Circular references</issue>
                <issue>Unbounded arrays/maps</issue>
              </watch-for>
              
              <testing-process>
                <step>Open/close files repeatedly</step>
                <step>Check memory usage in DevTools</step>
                <step>Ensure garbage collection happens</step>
                <step>Monitor heap size over time</step>
              </testing-process>
            </memory-safety-verification>
            
            <large-file-handling title="Large File Handling">
              <test-with-edge-cases>
                <case>10x typical file size</case>
                <case>Malformed files</case>
                <case>Files with unexpected data</case>
                <case>Empty files</case>
                <case>Corrupted files</case>
              </test-with-edge-cases>
              
              <graceful-degradation>
                <action>Show warning for very large files</action>
                <action>Stream processing if possible</action>
                <action>Offer to cancel long operations</action>
                <action>Progress indicators for long tasks</action>
              </graceful-degradation>
            </large-file-handling>
            
            <crash-recovery-implementation title="Crash Recovery Implementation">
              <auto-save-system>
                <code-example language="typescript">// Auto-save every 30 seconds
setInterval(() =&gt; {
  localStorage.setItem('autosave', JSON.stringify(project));
}, 30000);

window.addEventListener('beforeunload', () =&gt; {
  localStorage.setItem('autosave', JSON.stringify(project));
});</code-example>
              </auto-save-system>
              
              <recovery-on-restart>
                <code-example language="typescript">// On startup:
const saved = localStorage.getItem('autosave');
if (saved) {
  showRecoveryDialog({
    message: 'Recover unsaved work?',
    onRecover: () =&gt; loadProject(JSON.parse(saved)),
    onDiscard: () =&gt; localStorage.removeItem('autosave')
  });
}</code-example>
              </recovery-on-restart>
              
              <clear-error-messages>
                <replace>Replace: "Oops! Something went wrong"</replace>
                <with>With: "Failed to load file: Invalid MIDI header at byte 12"</with>
              </clear-error-messages>
            </crash-recovery-implementation>
            
            <logging-system-implementation title="Logging System Implementation">
              <structured-logging-setup>
                <code-example language="typescript">logger.info('File loaded', { filename, size, duration });
logger.warn('Performance slow', { operation: 'analysis', duration: 5000 });
logger.error('Analysis failed', { error: err.message, context: { filename, noteCount } });</code-example>
              </structured-logging-setup>
              
              <what-to-log>
                <item>Errors with stack traces</item>
                <item>User actions (for debugging)</item>
                <item>Performance metrics</item>
                <item>State transitions</item>
                <item>API calls and responses</item>
              </what-to-log>
              
              <log-levels>
                <level>DEBUG: Detailed info for development</level>
                <level>INFO: Normal operational messages</level>
                <level>WARN: Warning messages (non-critical)</level>
                <level>ERROR: Error messages (require attention)</level>
              </log-levels>
            </logging-system-implementation>
            
            <input-validation-implementation title="Input Validation Implementation">
              <validation-checklist>
                <check>File types (not just extension - check magic bytes)</check>
                <check>File size (before loading entire file)</check>
                <check>Data structure (schema validation)</check>
                <check>User input (forms, text fields)</check>
              </validation-checklist>
              
              <validation-example>
                <code-example language="typescript">function validateMidiFile(buffer: ArrayBuffer): Result&lt;MidiData&gt; {
  if (buffer.byteLength === 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (!isMidiHeader(buffer)) {
    return { ok: false, error: 'Not a valid MIDI file' };
  }
  if (buffer.byteLength &gt; 50 * 1024 * 1024) {
    return { ok: false, error: 'File too large (max 50MB)' };
  }
  return { ok: true, data: parseMidi(buffer) };
}</code-example>
              </validation-example>
            </input-validation-implementation>
            
            <retry-logic-implementation title="Retry Logic Implementation (Network Operations)">
              <exponential-backoff>
                <code-example language="typescript">async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i &lt; retries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay(1000 * Math.pow(2, i)); // 1s, 2s, 4s
    }
  }
}</code-example>
              </exponential-backoff>
              
              <user-feedback-during-retries>
                <item>Show retry count: "Retry 2 of 3..."</item>
                <item>Allow manual cancel</item>
                <item>Clear error on final failure</item>
              </user-feedback-during-retries>
            </retry-logic-implementation>
            
            <layer5-exit-criteria title="Layer 5 Exit Criteria">
              <performance-checklist>
                <check>Large files (10x normal size) don't freeze UI</check>
                <check>Analysis completes within budget</check>
                <check>Memory usage stable over time</check>
                <check>No memory leaks</check>
                <check>Heavy work happens in workers</check>
                <check>App recovers from crashes</check>
                <check>Errors logged with context</check>
                <check>Retry logic for network operations</check>
                <check>Input validated before processing</check>
              </performance-checklist>
              
              <professional-reliability-check>
                <question>Could a professional rely on this mid-session?</question>
                <question>Does it handle errors gracefully?</question>
                <question>Is performance acceptable with realistic data?</question>
                <question>Can users recover from crashes?</question>
              </professional-reliability-check>
              
              <documentation>
                <doc>Performance budget documented</doc>
                <doc>Logging system configured</doc>
                <doc>Crash recovery tested</doc>
                <doc>Retry logic implemented and tested</doc>
              </documentation>
              
              <key-question>Could a professional rely on this mid-session without fear?</key-question>
            </layer5-exit-criteria>
          </layer5-detail>
        </layer>
        
        <layer number="6" name="Design System">
          <goal>Consistent components, typography, spacing, and theming; no one-off styling</goal>
          <source>All visual decisions (colors, spacing, radii, typography, component variants, visual hierarchy) originate from the read‑only root folder ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ at the monorepo root.</source>
          <token-build>A token build step converts the style guide JSON into design tokens (CSS/TS) consumed by shared components (@antiphon/ui-components).</token-build>
          <missing-tokens>If a requested token or style is missing, Codex must use an explicit placeholder and emit a warning pointing to the missing key; it must not silently invent defaults.</missing-tokens>
          <extensions>Extensions or gaps are filled via separate shared modules (e.g. shared/ui-tokens/), which extend but do not modify ANTIPHON_COLOR_TYPE_STYLE_GUIDE/.</extensions>
          <mocks-doctrine>Mocks are allowed ONLY as visual scaffolds. If a mock implies functionality, either implement that functionality or label it explicitly as non-functional placeholder.</mocks-doctrine>
          <gate>Shared components exist; screens use the system; design debt is contained; changes in the style guide propagate across apps via tokens and shared components</gate>
          
          <layer6-detail>
            <purpose>Make every visual and typographic decision come from a single style guide root, so all Antiphon apps share one coherent design language and can be re‑themed by editing one place.</purpose>
            <principle>Build once, use everywhere, from ANTIPHON_COLOR_TYPE_STYLE_GUIDE.</principle>
            
            <style-guide-root-folder title="Style Guide Root Folder">
              <root-location>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ (sibling of packages/, shared/, docs/, etc.)</root-location>
              
              <authoritative-source-for>
                <item>Color palette</item>
                <item>Spacing system</item>
                <item>Border radius</item>
                <item>Shadows</item>
                <item>Typography (fonts, sizes, weights, line heights)</item>
                <item>Visual hierarchy (headings, body text, emphasis)</item>
                <item>Component variants (Button, Card, Modal, Input, etc.)</item>
                <item>Interpretation rules and design intent</item>
              </authoritative-source-for>
              
              <required-files title="Required files (minimum):">
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/palette.json</file>
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/spacing.json</file>
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/radius.json</file>
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/shadows.json</file>
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/typography.json</file>
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/visual-hierarchy.json</file>
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/components.json</file>
                <file>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/guidelines.md (how to extend/interpret the system)</file>
              </required-files>
              
              <modification-rule>Every other part of the suite (tokens build step, @antiphon/ui-components, app UIs) reads from this root folder; and if there is a mismatch or something absent, amend or extend in a new design folder with the decisions (anywhere you prefer, but not in the ANTIPHON_COLOR_TYPE_STYLE_GUIDE/).</modification-rule>
            </style-guide-root-folder>
            
            <design-tokens-generated title="Design Tokens Generated From Style Guide">
              <token-build-step>Implement a small build step that turns the JSON files in ANTIPHON_COLOR_TYPE_STYLE_GUIDE into design tokens (CSS variables and/or TypeScript constants) consumed by all apps.</token-build-step>
              
              <colors-example title="Colors (palette.json → color tokens)">
                <palette-json>
                  <code-example language="json">{
  "background": {
    "primary": "#000000",
    "secondary": "#1a1a1a",
    "tertiary": "#333333"
  },
  "text": {
    "primary": "#ffffff",
    "secondary": "#b3b3b3"
  },
  "border": {
    "default": "#666666"
  },
  "accent": {
    "gold": "#fbbf24",
    "blue": "#60a5fa",
    "red": "#fca5a5"
  }
}</code-example>
                </palette-json>
                
                <generated-tokens>
                  <code-example language="css">:root {
  --color-bg-primary: #000000;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #333333;

  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3;

  --color-border-default: #666666;

  --color-accent-gold: #fbbf24;
  --color-accent-blue: #60a5fa;
  --color-accent-red: #fca5a5;
}</code-example>
                </generated-tokens>
              </colors-example>
              
              <spacing-example title="Spacing (spacing.json → spacing tokens)">
                <spacing-json>
                  <code-example language="json">{
  "xs": "0.25rem",
  "sm": "0.5rem",
  "md": "1rem",
  "lg": "1.5rem",
  "xl": "2rem"
}</code-example>
                </spacing-json>
                
                <generated-tokens>
                  <code-example language="css">:root {
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
}</code-example>
                </generated-tokens>
              </spacing-example>
              
              <radius-example title="Border Radius (radius.json → radius tokens)">
                <radius-json>
                  <code-example language="json">{
  "sm": "4px",
  "md": "8px",
  "lg": "12px",
  "full": "9999px"
}</code-example>
                </radius-json>
                
                <generated-tokens>
                  <code-example language="css">:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}</code-example>
                </generated-tokens>
              </radius-example>
              
              <shadows-example title="Shadows (shadows.json → shadow tokens)">
                <shadows-json>
                  <code-example language="json">{
  "sm": "0 1px 2px rgba(0, 0, 0, 0.1)",
  "md": "0 4px 6px rgba(0, 0, 0, 0.1)",
  "lg": "0 10px 15px rgba(0, 0, 0, 0.1)"
}</code-example>
                </shadows-json>
                
                <generated-tokens>
                  <code-example language="css">:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}</code-example>
                </generated-tokens>
              </shadows-example>
            </design-tokens-generated>
            
            <typography-visual-hierarchy title="Typography and Visual Hierarchy From Style Guide">
              <typography-example title="Typography (typography.json → font tokens)">
                <typography-json>
                  <code-example language="json">{
  "fontFamily": "Inter, -apple-system, sans-serif",
  "sizes": {
    "xs": "0.75rem",
    "sm": "0.875rem",
    "base": "1rem",
    "lg": "1.125rem",
    "xl": "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem"
  },
  "weights": {
    "normal": 400,
    "medium": 500,
    "semibold": 600
  },
  "lineHeights": {
    "tight": 1.1,
    "normal": 1.4,
    "relaxed": 1.6
  }
}</code-example>
                </typography-json>
                
                <generated-tokens>
                  <code-example language="css">:root {
  --font-family: Inter, -apple-system, sans-serif;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  --line-height-tight: 1.1;
  --line-height-normal: 1.4;
  --line-height-relaxed: 1.6;
}</code-example>
                </generated-tokens>
              </typography-example>
              
              <visual-hierarchy-example title="Visual Hierarchy (visual-hierarchy.json → text utilities)">
                <visual-hierarchy-json>
                  <code-example language="json">{
  "headingLevels": {
    "h1": { "size": "3xl", "weight": "semibold" },
    "h2": { "size": "2xl", "weight": "semibold" },
    "h3": { "size": "xl", "weight": "medium" }
  },
  "body": {
    "default": { "size": "base", "weight": "normal" },
    "muted": { "size": "sm", "weight": "normal" }
  },
  "emphasis": {
    "strong": "semibold",
    "subtle": "medium"
  }
}</code-example>
                </visual-hierarchy-json>
                
                <generated-tokens>
                  <code-example language="css">.h1 { font-size: var(--font-size-3xl); font-weight: var(--font-weight-semibold); }
.h2 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
.h3 { font-size: var(--font-size-xl);  font-weight: var(--font-weight-medium);  }

.text-body    { font-size: var(--font-size-base); font-weight: var(--font-weight-normal); }
.text-body-sm { font-size: var(--font-size-sm);   font-weight: var(--font-weight-normal); }

.text-strong  { font-weight: var(--font-weight-semibold); }
.text-subtle  { font-weight: var(--font-weight-medium); }</code-example>
                </generated-tokens>
              </visual-hierarchy-example>
            </typography-visual-hierarchy>
            
            <component-system-bound title="Component System Bound to Style Guide">
              <principle>All shared components come from @antiphon/ui-components and read their styles from the guide, never from ad‑hoc CSS in an app.</principle>
              
              <component-definitions title="Component Definitions (components.json)">
                <components-json>
                  <code-example language="json">{
  "button": {
    "variants": {
      "primary": {
        "bg": "accent.gold",
        "text": "text.primary"
      },
      "secondary": {
        "bg": "background.tertiary",
        "text": "text.primary"
      },
      "destructive": {
        "bg": "accent.red",
        "text": "text.primary"
      }
    },
    "sizes": {
      "sm": { "paddingY": "xs", "paddingX": "sm" },
      "md": { "paddingY": "sm", "paddingX": "md" },
      "lg": { "paddingY": "md", "paddingX": "lg" }
    }
  }
}</code-example>
                </components-json>
                
                <build-step-note>A small build step resolves semantic paths like accent.gold → --color-accent-gold and emits CSS for btn--primary, btn--secondary, etc.</build-step-note>
              </component-definitions>
              
              <shared-component-package title="Shared Component Package">
                <package>@antiphon/ui-components</package>
                
                <exposes-primitives>
                  <primitive>Button</primitive>
                  <primitive>Card</primitive>
                  <primitive>Modal</primitive>
                  <primitive>Input</primitive>
                  <primitive>Select</primitive>
                  <primitive>Tooltip</primitive>
                </exposes-primitives>
                
                <components-rules>
                  <rule>Accept props for variant/size/state</rule>
                  <rule>Use only tokens derived from the style guide</rule>
                  <rule>Do not embed raw hex codes or arbitrary spacing</rule>
                </components-rules>
                
                <example-button>
                  <code-example language="typescript">export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () =&gt; void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  onClick
}: ButtonProps) {
  return (
    &lt;button
      type="button"
      className={`btn btn--${variant} btn--${size}`}
      disabled={disabled}
      onClick={onClick}
    &gt;
      {children}
    &lt;/button&gt;
  );
}</code-example>
                </example-button>
              </shared-component-package>
            </component-system-bound>
            
            <missing-tokens-placeholders title="Missing Tokens &amp; Placeholders (No Silent Defaults)">
              <principle>Visual decisions live in the folder, but if something is missing or mis‑typed:</principle>
              
              <token-resolver-must>
                <action>Apply an obvious placeholder (e.g., var(--design-missing-color) / magenta debug style)</action>
                <action>Emit a warning or error identifying the missing key: e.g., Missing design token: button.primary.bg – add it to separate folder dedicated to amendments, with a created secondary components.json. This separate folder will ideally be readable to other app in the monorepo. Do not change contents of ANTIPHON_COLOR_TYPE_STYLE_GUIDE/</action>
              </token-resolver-must>
              
              <guarantee>The system must not silently invent "safe" defaults like random blues or grays.</guarantee>
              
              <benefits>
                <benefit>You always notice missing design decisions</benefit>
                <benefit>The style guide stays the real single source of truth</benefit>
              </benefits>
            </missing-tokens-placeholders>
            
            <accessibility-wcag-aa title="Accessibility and WCAG AA">
              <principle>Accessibility is part of the design system contract and implemented once in @antiphon/ui-components.</principle>
              
              <keyboard-navigation>
                <rule>All interactive elements tabbable in a logical order</rule>
                <rule>Visible focus states using high‑contrast tokens</rule>
                <rule>Escape closes modals and overlays</rule>
                <rule>Enter/Space activate buttons and primary actions</rule>
              </keyboard-navigation>
              
              <screen-readers>
                <rule>Alt text on images</rule>
                <rule>ARIA labels for icon‑only buttons</rule>
                <rule>Landmark roles (main, nav, header, footer)</rule>
                <rule>Dialog components use role="dialog" and aria-modal="true"</rule>
              </screen-readers>
              
              <focus-management>
                <rule>Focus trapped within modals while open</rule>
                <rule>Focus returns to triggering element when modal closes</rule>
                <rule>Skip links to main content</rule>
                <rule>Focus moves to meaningful targets after route changes</rule>
              </focus-management>
              
              <contrast-wcag-aa>
                <rule>Body text: contrast ratio ≥ 4.5:1 against background</rule>
                <rule>Large text (18px+ or 14px bold): contrast ratio ≥ 3:1</rule>
                <rule>UI controls and interactive icons: contrast ratio ≥ 3:1</rule>
                <rule>Whenever new colors are added to palette.json, they must be checked against intended backgrounds with a contrast checker and adjusted or rejected if they cannot meet these thresholds</rule>
              </contrast-wcag-aa>
            </accessibility-wcag-aa>
            
            <layer6-exit-criteria title="Layer 6 Exit Criteria">
              <criteria>Layer 6 is complete when the design system is real, centralized, and enforceable:</criteria>
              
              <checklist>
                <check>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ is read, with secondary folder filling the gaps, with: palette.json, spacing.json, radius.json, shadows.json, typography.json, visual-hierarchy.json, components.json, guidelines.md describing how to extend and interpret the system</check>
                <check>A build step converts these JSON files into design tokens (CSS/TS) consumed by all apps</check>
                <check>All shared components in @antiphon/ui-components use only these tokens and component definitions (no app‑local ad‑hoc styling)</check>
                <check>If a requested token or style is missing, the system uses a visible placeholder and surfaces a warning mentioning the exact missing key, without inventing defaults</check>
                <check>WCAG AA contrast rules are satisfied for all text and interactive elements across the default theme</check>
                <check>Accessibility behaviors (keyboard, focus, ARIA) are implemented in shared primitives and verified</check>
                <check>A new Antiphon app can be built using only: The style guide folder, The token build step, The @antiphon/ui-components library</check>
                <check>Changing a design decision in ANTIPHON_COLOR_TYPE_STYLE_GUIDE (e.g., primary accent color or heading size) updates all apps automatically without editing individual app code</check>
              </checklist>
              
              <key-questions>
                <question>If I tweak a color or font in ANTIPHON_COLOR_TYPE_STYLE_GUIDE, do all apps change accordingly without manual edits?</question>
                <question>Could I ship a new Antiphon app using only the style guide + UI component library and still match the suite's look and behavior?</question>
                <question>Does the system loudly tell me when a design token is missing instead of guessing?</question>
              </key-questions>
              
              <rule>If any answer is "no", Layer 6 is not done.</rule>
            </layer6-exit-criteria>
          </layer6-detail>
        </layer>
        
        <layer number="7" name="Motion &amp; Interaction">
          <goal>Premium feel via transitions, micro-interactions, loading states, and responsiveness</goal>
          <base-motion>Base motion language (philosophy, timing ranges, core presets) is defined in ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ (read‑only).</base-motion>
          <concrete-implementation>Concrete Framer Motion variants and any additional presets are implemented in shared motion modules (e.g. shared/motion/), which read from the style guide and extend it without modifying it.</concrete-implementation>
          <requirements>
            <requirement>Motion must be consistent across apps</requirement>
            <requirement>Motion must be purposeful</requirement>
            <requirement>Motion must be restrained</requirement>
            <requirement>Motion must respect reduced-motion preferences</requirement>
            <requirement>Motion may not mask missing correctness or broken flows</requirement>
          </requirements>
          <gate>Motion is consistent, purposeful, accessible (supports prefers-reduced-motion), and implemented through shared motion primitives rather than per‑app ad‑hoc animations</gate>
          
          <layer7-detail>
            <purpose>Add life, weight, and tactile feel—only after behavior is solid.</purpose>
            <warning>⚠️ WARNING: If you're here before Layers 1-6 are complete, you're procrastinating with aesthetics.</warning>
            <source>All motion and interaction patterns originate from the read‑only ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ at the monorepo root, and may be extended by a separate, writable motion layer that other apps can see.</source>
            
            <motion-source-of-truth title="Motion Source of Truth">
              <antiphon-color-type-style-guide>
                <rule>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ is read‑only for Codex and all tools</rule>
                <defines>It defines the base motion language (philosophy, presets, timing ranges, do/don't rules), typically in: ANTIPHON_COLOR_TYPE_STYLE_GUIDE/motion.json, ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ANTIPHON_ANIMATION_SYSTEM.md</defines>
              </antiphon-color-type-style-guide>
              
              <if-missing>
                <rule>If any needed motion preset or pattern is missing from the guide: Codex must not modify ANTIPHON_COLOR_TYPE_STYLE_GUIDE/</rule>
                <instead>Instead, Codex must create or update a secondary extension file in a shared, writable location, for example: shared/motion/antiphon-motion-extensions.json, shared/motion/antiphon-motion-extensions.ts</instead>
                <extension-file-must>
                  <action>Imports / reads the base motion definitions from the style guide</action>
                  <action>Adds new presets or overrides in a clearly separated way</action>
                  <action>Is accessible to all apps in the monorepo</action>
                </extension-file-must>
              </if-missing>
              
              <rule-summary>
                <canonical>ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ = canonical base spec (read‑only)</canonical>
                <writable>shared/motion/* (or similar) = app‑writable extensions that compose with the base spec</writable>
              </rule-summary>
            </motion-source-of-truth>
            
            <antiphon-motion-philosophy title="The Antiphon Motion Philosophy">
              <guiding-principles>
                <principle>Motion is purposeful, weighted, restrained</principle>
                <principle>Evokes analog equipment (heavy switches, smooth dials)</principle>
                <principle>No flashy gimmicks, no cartoonish bounces</principle>
                <principle>Animations serve utility, not decoration</principle>
              </guiding-principles>
              
              <source>These principles live in the style guide (ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ANTIPHON_ANIMATION_SYSTEM.md) and any extension files must respect them.</source>
            </antiphon-motion-philosophy>
            
            <key-animation-presets title="Key Animation Presets (From Style Guide + Extensions)">
              <note>Base presets are documented in ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ANTIPHON_ANIMATION_SYSTEM.md and/or motion.json. If you need a new preset and it isn't in the base guide: Add it to shared/motion/antiphon-motion-extensions.* as an extension, not by editing the style guide.</note>
              
              <preset name="Card Entrance">
                <characteristic>Grows from top-left (scale 0.8 → 1.0)</characteristic>
                <characteristic>Spring physics with gentle overshoot</characteristic>
                <characteristic>Duration: ~300-400ms</characteristic>
              </preset>
              
              <preset name="Tooltip">
                <characteristic>Fast fade + slide (150-200ms)</characteristic>
                <characteristic>Appears near trigger element</characteristic>
              </preset>
              
              <preset name="Modal">
                <characteristic>Slower entrance (≈350ms)</characteristic>
                <characteristic>Fade + subtle scale</characteristic>
                <characteristic>Overlay fade-in</characteristic>
              </preset>
              
              <preset name="Button Press">
                <characteristic>Slight scale down (0.98)</characteristic>
                <characteristic>Immediate feedback (&lt;100ms)</characteristic>
              </preset>
            </key-animation-presets>
            
            <framer-motion-implementation title="Framer Motion Implementation">
              <install-framer-motion>
                <command>pnpm add framer-motion</command>
              </install-framer-motion>
              
              <define-motion-presets title="Define Motion Presets in a Shared Module">
                <note>A shared motion module (e.g. shared/motion/antiphon-motion.ts) should: Read base config from ANTIPHON_COLOR_TYPE_STYLE_GUIDE/motion.json (read‑only), Define concrete Framer Motion variants, Optionally merge in any extension presets from shared/motion/antiphon-motion-extensions.*</note>
                
                <example>
                  <code-example language="typescript">// shared/motion/antiphon-motion.ts
export const cardVariant = {
  hidden: { opacity: 0, scale: 0.8, originX: 0, originY: 0 },
  visible: { 
    opacity: 1, 
    scale: 1.0,
    transition: { type: 'spring', stiffness: 120, damping: 20 }
  }
};

export const tooltipVariant = {
  hidden: { opacity: 0, y: 4 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.15, ease: 'easeOut' }
  }
};

export const modalVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1.0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
};</code-example>
                </example>
                
                <note>If a preset is missing in the style guide, Codex may define it here (or in antiphon-motion-extensions.ts), but must not alter ANTIPHON_COLOR_TYPE_STYLE_GUIDE/.</note>
              </define-motion-presets>
              
              <use-in-components>
                <code-example language="typescript">import { motion } from 'framer-motion';
import { cardVariant } from '@antiphon/motion'; // e.g. shared/motion entrypoint

export function Card({ children }: Props) {
  return (
    &lt;motion.div 
      className="app-card"
      variants={cardVariant}
      initial="hidden"
      animate="visible"
    &gt;
      {children}
    &lt;/motion.div&gt;
  );
}</code-example>
              </use-in-components>
            </framer-motion-implementation>
            
            <timing-standards title="Timing Standards">
              <by-element-weight>
                <weight>Small/light (icons, tooltips): 150–200ms</weight>
                <weight>Medium (cards, buttons): 200–300ms</weight>
                <weight>Large (modals, panels): 300–400ms</weight>
              </by-element-weight>
              
              <rule>Never exceed 500ms for UI animations (feels sluggish)</rule>
              
              <note>These ranges should be reflected in the base style guide; extensions must stay within them unless explicitly justified.</note>
            </timing-standards>
            
            <microinteractions-implementation title="Microinteractions Implementation">
              <button-press>
                <code-example language="typescript">&lt;motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
&gt;
  Click me
&lt;/motion.button&gt;</code-example>
              </button-press>
              
              <hover-effects>
                <code-example language="css">.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  box-shadow: 0 12px 30px rgba(0,0,0,0.4);
}</code-example>
              </hover-effects>
              
              <focus-states>
                <code-example language="css">.btn:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 2px;
}</code-example>
              </focus-states>
              
              <note>Microinteractions should preferably be defined as reusable patterns in the shared motion module, not as ad‑hoc variants per app.</note>
            </microinteractions-implementation>
            
            <layout-transitions title="Layout Transitions">
              <animate-presence-for-enter-exit>
                <code-example language="typescript">import { AnimatePresence, motion } from 'framer-motion';

&lt;AnimatePresence mode="wait"&gt;
  {isOpen &amp;&amp; (
    &lt;motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    &gt;
      Content
    &lt;/motion.div&gt;
  )}
&lt;/AnimatePresence&gt;</code-example>
              </animate-presence-for-enter-exit>
              
              <list-item-transitions>
                <code-example language="typescript">&lt;AnimatePresence&gt;
  {items.map(item =&gt; (
    &lt;motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    &gt;
      {item.content}
    &lt;/motion.div&gt;
  ))}
&lt;/AnimatePresence&gt;</code-example>
              </list-item-transitions>
              
              <note>Again, these patterns should be centralized in the shared motion layer so all apps animate in the same way.</note>
            </layout-transitions>
            
            <sound-design title="Sound Design (Optional)">
              <identify-sound-moments>
                <moment>Button click: soft mechanical click</moment>
                <moment>Modal open: gentle "whoosh"</moment>
                <moment>Error: subtle alert tone</moment>
                <moment>Success: confirmation chime</moment>
              </identify-sound-moments>
              
              <note>These guidelines live in the style guide doc; actual sound file paths and toggles can be implemented in shared utilities.</note>
              
              <sound-implementation>
                <code-example language="typescript">const playSound = (soundFile: string) =&gt; {
  const audio = new Audio(soundFile);
  audio.volume = 0.3; // Keep quiet
  audio.play();
};

&lt;button onClick={() =&gt; {
  handleAction();
  playSound('/sounds/click.mp3');
}}&gt;
  Click
&lt;/button&gt;</code-example>
              </sound-implementation>
              
              <sound-requirements>
                <requirement>Very quiet (&lt; −20dB)</requirement>
                <requirement>Short (&lt; 200ms)</requirement>
                <requirement>Optional (user can disable in settings)</requirement>
              </sound-requirements>
            </sound-design>
            
            <reduced-motion-support title="Reduced Motion Support">
              <detect-user-preference>
                <code-example language="typescript">const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;</code-example>
              </detect-user-preference>
              
              <conditional-animations>
                <code-example language="typescript">const cardVariant = {
  hidden: prefersReducedMotion 
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.8 },
  visible: prefersReducedMotion
    ? { opacity: 1, transition: { duration: 0.1 } }
    : { opacity: 1, scale: 1.0, transition: { type: 'spring', stiffness: 120, damping: 20 } }
};</code-example>
              </conditional-animations>
              
              <note>The reduced‑motion behavior should be part of the shared motion module so apps don't have to re‑implement it.</note>
            </reduced-motion-support>
            
            <layer7-exit-criteria title="Layer 7 Exit Criteria">
              <motion-polish-checklist>
                <check>Base motion philosophy and presets documented in ANTIPHON_COLOR_TYPE_STYLE_GUIDE/ (read‑only)</check>
                <check>A shared motion module (e.g. shared/motion/*) exists that: Reads base motion definitions from the style guide, Defines concrete variants for Framer Motion, Extends the base spec only in extension files (does not modify the guide)</check>
                <check>Motion presets (card, tooltip, modal, button, etc.) are defined and implemented in shared motion, not per‑app</check>
                <check>All transitions respect the timing ranges (150–400ms, never &gt;500ms)</check>
                <check>Microinteractions (hover, press, focus) are implemented consistently across apps via shared components</check>
                <check>Motion can be reduced or disabled via prefers-reduced-motion and shared motion logic</check>
                <check>No animation exceeds 400ms in normal mode</check>
                <check>Layout transitions (screen changes, list changes) are smooth and consistent</check>
                <check>Sound design, if used, follows the quiet/short/optional rules</check>
              </motion-polish-checklist>
              
              <key-questions>
                <question>Does motion serve utility or just look pretty?</question>
                <question>Are animations fast enough (no sluggishness)?</question>
                <question>Is motion consistent across all screens and apps (thanks to the shared motion layer)?</question>
                <question>Can motion be reduced/disabled for accessibility across the entire suite?</question>
              </key-questions>
              
              <validation>
                <action>Test with prefers-reduced-motion enabled</action>
                <action>Test on slower devices</action>
                <action>Get feedback: does motion feel purposeful and "Antiphon‑like", not distracting?</action>
              </validation>
              
              <documentation>
                <doc>Motion presets documented with examples (in the style guide + shared module)</doc>
                <doc>Timing standards documented</doc>
                <doc>Accessibility considerations (reduced motion, focus, screen readers) documented</doc>
              </documentation>
              
              <rule>If any of these fail—especially if motion logic is scattered per‑app instead of going through the style‑guide + shared motion layer—Layer 7 is not done.</rule>
            </layer7-exit-criteria>
          </layer7-detail>
        </layer>
        
        <layer number="8" name="Packaging &amp; Release">
          <goal>Versioning, signing, installers, release notes, and update mechanism (as applicable)</goal>
          <release-gate-matrix>Use incremental correction—add gates where missing, tighten as issues are discovered</release-gate-matrix>
          <gate>Release artifact installs and runs; release checklist complete</gate>
          
          <layer8-detail>
            <purpose>Become a company, not just a coder.</purpose>
            <key-question>Can we push an update without fear?</key-question>
            
            <!-- Layer 8 content continues in next part... -->
            
          </layer8-detail>
        </layer>
      </layers>
    </eight-layer-pyramid>
    
    <!-- Remaining constitution sections continue... -->
    
  </constitution>
  
</antiphon-codex-language>