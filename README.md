# Identity

A growing library of friendly, **vendor-agnostic** field guides to digital identity &  built from the official IETF RFCs and OASIS standards. Each guide starts with everyday analogies and builds up to spec-level depth, in a light-blue / terminal hybrid style with dark mode.access 


## Structure

```
Identity/
 Concepts/
 Modern Auth/    
 OAuth & OpenID Connect/   -> 7-page guide (RFC 6749/6750/6819/7636/9700, OIDC Core)        
 SAML/                      -> 6-page guide (OASIS SAML 2.0)        
```

## Guides

### [Modern Auth](https://heitor-mocelin.github.io/Identity/Concepts/ModernAuth/)
The protocols behind "Sign in with..." and enterprise SSO.

- **[OAuth 2.0 & OpenID Connect](https://heitor-mocelin.github.io/Identity/Concepts/ModernAuth/ delegated access & social login. Why, Roles, Authorization Code flow (+ PKCE), Tokens, OpenID Connect, Security.OAuthOpenIDConnect/)** 
- **[SAML 2.0](https://heitor-mocelin.github.io/Identity/Concepts/ModernAuth/ enterprise single sign-on. Why, Roles, SSO flow, Assertions, Security (+ SAML vs OAuth/OIDC).SAML/)** 

## Standards referenced

- IETF: RFC 6749, RFC 6750, RFC 6819, RFC 7636 (PKCE), RFC 9700 (Security BCP)
- OpenID Foundation: OpenID Connect Core 1.0
- OASIS: SAML 2.0 Core, Bindings, Profiles, Metadata, Security & Privacy Considerations

All content is vendor-neutral: it describes the protocols themselves, not any single product.
