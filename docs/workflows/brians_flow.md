# how brian uses the docs and agents
try not to work on main branch as much as possible


## design
### Major features
- PLAN: create ADR 
    - review -> web search -> send to 2nd agent -> review feedback -> deciede which feed to send to primary agent
    - use slash commands `/create-adr`
- PLAN: implementation plan 
    - review ADR, pervious implementation plans, git history and explore code. ultrathink create detailed implementation with subplans as needed. make sure plan references standards and templates 
    - review -> web search -> send to 2nd agent -> review feedback -> deciede which feed to send to primary agent
    - use slash commands `/create-implementation-plan`
- IMPLEMENT & VALIDATE: 
    - create a worktree
    - start agent in work and tell them to implement plan
    - validation
        - have 2nd agent review the implementation plan(s) and implementation code. send feedback to implementing agent as necessary. sometimes new sub plans can be created as needed
        - execute automated test plans
        - some manual verification
        - commit and update implementatino plans with status
- FINISH
    - go back to main branch
    - execute slash command `/merge-and-archive` 

#### todo
- create slash commands and annotate which steps are done by humans vs agents 
- investigate skills or custom agents
- think about how to improve prompt adherance and tool calling

## model changes 
- need to think about openapi-spec workflow

## frontend only change

## backend only change

## future reading
- https://www.claude.com/blog/improving-frontend-design-through-skills
- https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb