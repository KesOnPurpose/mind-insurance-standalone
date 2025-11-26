# ACCESSIBILITY-CHECKLIST.md

## WCAG AA Compliance Checklist for Mind Insurance Grouphome App

### Overview
This checklist ensures the Mind Insurance Grouphome App meets WCAG 2.1 Level AA standards for accessibility, providing an inclusive experience for all users, including those with disabilities.

---

## 🎯 Core Requirements

### Success Criteria Levels
- **Level A**: Essential (baseline)
- **Level AA**: Recommended standard (OUR TARGET)
- **Level AAA**: Enhanced (not required for compliance)

---

## ✅ WCAG AA Compliance Checklist

### 1. Perceivable

#### 1.1 Text Alternatives
- [ ] **Images**: All images have descriptive alt text
- [ ] **Decorative images**: Use empty alt="" or CSS backgrounds
- [ ] **Complex images**: Provide long descriptions where needed
- [ ] **Icons**: Icon buttons have accessible labels
- [ ] **SVGs**: Include title and desc elements or aria-label

#### 1.2 Time-based Media
- [ ] **Captions**: Videos have captions
- [ ] **Audio descriptions**: Provided for video content
- [ ] **Transcripts**: Available for audio-only content

#### 1.3 Adaptable
- [ ] **Semantic HTML**: Use proper heading hierarchy (h1-h6)
- [ ] **Lists**: Use ol/ul/dl for list content
- [ ] **Tables**: Include headers, captions, and scope attributes
- [ ] **Forms**: Associate labels with form controls
- [ ] **Regions**: Use landmark roles (main, nav, aside)

#### 1.4 Distinguishable
- [ ] **Color contrast (normal text)**: Minimum 4.5:1 ratio
- [ ] **Color contrast (large text)**: Minimum 3:1 ratio (18pt or 14pt bold)
- [ ] **Color contrast (UI components)**: Minimum 3:1 ratio
- [ ] **Not color alone**: Don't rely solely on color to convey information
- [ ] **Text spacing**: Content readable with increased spacing
- [ ] **Reflow**: Content reflows at 320px without horizontal scroll

### 2. Operable

#### 2.1 Keyboard Accessible
- [ ] **All functionality keyboard accessible**: No keyboard traps
- [ ] **Skip links**: Provide skip to main content link
- [ ] **Focus order**: Logical tab order matching visual layout
- [ ] **Shortcuts**: Document and make configurable

#### 2.2 Enough Time
- [ ] **Timing adjustable**: Users can extend time limits
- [ ] **Pause, stop, hide**: For moving/blinking content
- [ ] **Auto-updating**: Can be paused or controlled

#### 2.3 Seizures
- [ ] **Three flashes**: Nothing flashes >3 times per second

#### 2.4 Navigable
- [ ] **Page titles**: Descriptive and unique
- [ ] **Focus visible**: Clear focus indicators
- [ ] **Link purpose**: Clear from link text or context
- [ ] **Multiple ways**: Multiple ways to find pages
- [ ] **Headings and labels**: Descriptive headings/labels
- [ ] **Focus visible (enhanced)**: Always visible keyboard focus

#### 2.5 Input Modalities
- [ ] **Pointer gestures**: Alternative for path-based gestures
- [ ] **Pointer cancellation**: Can abort or undo actions
- [ ] **Label in name**: Visible labels match accessible names
- [ ] **Motion actuation**: Alternative to motion-based input
- [ ] **Target size**: Minimum 44x44 CSS pixels (with exceptions)

### 3. Understandable

#### 3.1 Readable
- [ ] **Language of page**: Declare page language (html lang)
- [ ] **Language of parts**: Declare language changes

#### 3.2 Predictable
- [ ] **On focus**: No unexpected context changes
- [ ] **On input**: No unexpected context changes
- [ ] **Consistent navigation**: Consistent across pages
- [ ] **Consistent identification**: Consistent labeling

#### 3.3 Input Assistance
- [ ] **Error identification**: Clearly identify errors
- [ ] **Labels or instructions**: Provide for user input
- [ ] **Error suggestion**: Suggest corrections
- [ ] **Error prevention**: Review/confirm for important actions
- [ ] **Help**: Context-sensitive help available

### 4. Robust

#### 4.1 Compatible
- [ ] **Parsing**: Valid HTML (no duplicate IDs, proper nesting)
- [ ] **Name, role, value**: Available to assistive technology
- [ ] **Status messages**: Announced without focus change

---

## 🎨 Color Contrast Requirements

### Text Contrast Ratios
| Text Type | Minimum Ratio | Notes |
|-----------|--------------|--------|
| Normal text | 4.5:1 | < 18pt (24px) or < 14pt (18.5px) bold |
| Large text | 3:1 | ≥ 18pt (24px) or ≥ 14pt (18.5px) bold |
| UI components | 3:1 | Buttons, inputs, focus indicators |
| Placeholder text | 4.5:1 | Must meet normal text ratio |
| Disabled elements | No requirement | But consider usability |

### Testing Tools
- Chrome DevTools (Lighthouse)
- axe DevTools extension
- WAVE (WebAIM)
- Contrast ratio checkers

---

## ⌨️ Keyboard Navigation Requirements

### Essential Keyboard Support
| Action | Key(s) | Component |
|--------|--------|-----------|
| Navigate forward | Tab | All interactive elements |
| Navigate backward | Shift + Tab | All interactive elements |
| Activate button | Enter or Space | Buttons |
| Select option | Arrow keys | Dropdowns, menus |
| Close modal/menu | Escape | Modals, dropdowns |
| Submit form | Enter | Form fields |
| Check/uncheck | Space | Checkboxes |
| Select radio | Arrow keys | Radio groups |

### Focus Management
- [ ] **Visible focus indicators**: Minimum 2px solid outline
- [ ] **Focus contrast**: 3:1 ratio against background
- [ ] **Focus order**: Matches reading/interaction order
- [ ] **Focus trap**: Only in modals (with escape)
- [ ] **Focus restoration**: Return focus after modal close

---

## 📱 Screen Reader Compatibility

### ARIA Best Practices
- [ ] **Semantic HTML first**: Use native elements when possible
- [ ] **ARIA labels**: For icon buttons and complex widgets
- [ ] **ARIA descriptions**: For additional context
- [ ] **Live regions**: For dynamic content updates
- [ ] **Roles**: Only when semantic HTML insufficient
- [ ] **States**: aria-expanded, aria-selected, etc.

### Common Screen Readers to Test
- **NVDA** (Windows) - Free
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in

### Announcement Patterns
```html
<!-- Button with icon only -->
<button aria-label="Delete item">
  <TrashIcon />
</button>

<!-- Form field with error -->
<div>
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert">
    Please enter a valid email
  </span>
</div>

<!-- Live region for updates -->
<div aria-live="polite" aria-atomic="true">
  <p>Form saved successfully</p>
</div>
```

---

## 🧪 Testing Procedures

### Manual Testing Checklist

#### 1. Keyboard-Only Navigation
1. Unplug your mouse
2. Navigate entire app using only keyboard
3. Verify all interactive elements reachable
4. Check for keyboard traps
5. Ensure logical tab order

#### 2. Screen Reader Testing
1. Enable screen reader (VoiceOver, NVDA, etc.)
2. Navigate with screen reader commands
3. Verify all content announced properly
4. Check form labels and error messages
5. Test dynamic content updates

#### 3. Visual Testing
1. Zoom to 200% - content should reflow
2. Increase text spacing - should remain readable
3. Test with Windows High Contrast mode
4. Disable CSS - content should still be logical
5. Check color contrast with tools

#### 4. Automated Testing
```bash
# Run axe-core checks
npm run a11y:check

# Run Lighthouse CI
npm run lighthouse

# Run specific Lighthouse configs
npm run lighthouse:mobile
npm run lighthouse:tablet
```

### Browser Testing Matrix
| Browser | Version | Screen Reader | Priority |
|---------|---------|--------------|----------|
| Chrome | Latest | ChromeVox | High |
| Firefox | Latest | NVDA | High |
| Safari | Latest | VoiceOver | High |
| Edge | Latest | Narrator | Medium |

### Device Testing
- [ ] **Desktop**: 1440px, 1920px viewports
- [ ] **Tablet**: 768px viewport (iPad)
- [ ] **Mobile**: 375px viewport (iPhone)
- [ ] **Small mobile**: 320px viewport

---

## 🚨 Common Issues & Solutions

### Issue: Low color contrast
**Solution**: Use Tailwind utilities like `text-gray-900` on `bg-white` for 21:1 ratio

### Issue: Missing focus indicators
**Solution**: Add `focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`

### Issue: Keyboard trap in modal
**Solution**: Implement focus trap with escape key handling

### Issue: Form errors not announced
**Solution**: Use `role="alert"` and `aria-invalid="true"`

### Issue: Dynamic content not announced
**Solution**: Use `aria-live="polite"` regions

---

## 📊 Compliance Metrics

### Target Scores
- **Lighthouse Accessibility**: > 90
- **axe-core violations**: 0 critical, 0 serious
- **Keyboard navigation**: 100% functionality accessible
- **Screen reader**: 100% content perceivable
- **Color contrast**: 100% AA compliant

### Regular Audits
- [ ] **Weekly**: Automated testing with CI
- [ ] **Sprint**: Manual keyboard testing
- [ ] **Monthly**: Full screen reader testing
- [ ] **Quarterly**: Third-party accessibility audit

---

## 📚 Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Training
- [Web Accessibility by Google](https://www.udacity.com/course/web-accessibility--ud891)
- [Deque University](https://dequeuniversity.com/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## ⚡ Quick Reference Commands

```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react axe-core @lhci/cli

# Run accessibility checks
npm run a11y:check

# Run Lighthouse CI
npm run lighthouse

# Run Lighthouse for mobile
npm run lighthouse:mobile

# Run Lighthouse for tablet
npm run lighthouse:tablet

# Check TypeScript types
npx tsc --noEmit

# Run development server with a11y monitoring
npm run dev
# (accessibility.ts will auto-initialize in dev mode)
```

---

## 🏆 Certification

When all checklist items are complete:
1. Run full accessibility audit
2. Generate Lighthouse reports
3. Document any exceptions with justification
4. Obtain WCAG AA compliance certification
5. Schedule regular re-audits

**Remember**: Accessibility is not a one-time task but an ongoing commitment to inclusive design.

---

*Last Updated: November 2024*
*Version: 1.0.0*
*Compliance Level: WCAG 2.1 AA*