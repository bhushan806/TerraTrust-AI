# Problem and Product Definition

## Problem
Agricultural borrowers face rainfall variability, drought, flood, heat and other hazards that can affect yield, harvest timing, farm-gate prices, input costs and repayment capacity. A decision based only on past repayment records may miss changing conditions on the farm. FIN-03 adds climate and agricultural evidence to a lender's review; it does not replace underwriting policy or human accountability.

## Product concept
A multi-tenant institutional decision-support application that links a borrower and loan to farms, plots and crop cycles; records time- and location-specific climate/crop/market inputs; estimates yield and net income available for debt service; evaluates supported climate scenarios; explains material risk drivers; and stores immutable assessment snapshots with data/model provenance.

## Causal pathway to model carefully
Hazard and exposure → crop stress / expected yield → saleable production × expected price → gross revenue → less production costs and other obligations → income available for debt service → ability to meet the loan repayment schedule. This is a conceptual pathway, not proof of causality. Correlations and model contributions must not be described as causal effects without suitable causal evidence.

## Users and value
- Loan officer: prepare a review, inspect evidence, request reassessment, and generate a report.
- Credit-risk analyst: compare risk drivers and scenarios; review model limitations and portfolio patterns.
- Institution administrator: manage users, branches, permissions and data-source health.
- Farmer (beneficiary): potentially benefits from more contextual review; farmer-facing self-service is outside the initial institutional MVP.
- Buyer: bank, cooperative, NBFC or other eligible lender subject to its policies, procurement and applicable law. No partnership or endorsement is implied.

## What it does
Profiles farms/crop cycles; ingests or imports required data; reports freshness/completeness; predicts yield where a supported model exists; estimates farm income using explicit assumptions; stores loan obligations and verified credit inputs; supports climate scenarios; and presents explainable, auditable assessment snapshots.

## What it does not do
It does not guarantee harvests, insure crops, approve or reject loans automatically, infer repayment probability from yield labels, invent missing data, claim NABARD approval, or replace legal/compliance review. A demo dataset does not establish production suitability.

## Differentiation hypothesis
The proposed value is a traceable link between climate evidence, crop/yield outlook, farm cash-flow assumptions and loan obligations, with explicit data-quality warnings and reassessment history. This is a product hypothesis to validate with target institutions, not a proven market advantage.

## Dynamic reassessment
Reassess on material forecast changes, newly observed crop conditions, price updates, loan/repayment updates, or a configured schedule. Each run snapshots input timestamps, source IDs, feature versions, model version and reason. Stale or unavailable inputs must be surfaced; they must not silently be treated as current.
