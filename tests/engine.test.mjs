import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTFOLIO_CATALOG } from '../core/templates/portfolio-catalog.js';
import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import { generateSeoTags } from '../core/engines/seo-generator.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

test('Catalog contains 30 distinct role templates + Custom Canvas (31 items)', () => {
  assert.equal(PORTFOLIO_CATALOG.length, 31);
  const categories = {
    academic: PORTFOLIO_CATALOG.filter((t) => t.category === 'academic'),
    tech: PORTFOLIO_CATALOG.filter((t) => t.category === 'tech'),
    corporate: PORTFOLIO_CATALOG.filter((t) => t.category === 'corporate'),
    custom: PORTFOLIO_CATALOG.filter((t) => t.category === 'custom')
  };

  assert.equal(categories.academic.length, 10);
  assert.equal(categories.tech.length, 10);
  assert.equal(categories.corporate.length, 10);
  assert.equal(categories.custom.length, 1);
  assert.equal(PORTFOLIO_CATALOG[0].id, 'acad-flagship');
  assert.equal(PORTFOLIO_CATALOG[0].isRecommended, true);
});

test('renderPortfolioHtml renders successfully for every template without errors', () => {
  for (const tpl of PORTFOLIO_CATALOG) {
    const html = renderPortfolioHtml(fallbackData, { templateId: tpl.id });
    assert.ok(html.includes('<!DOCTYPE html>'), `Template ${tpl.id} failed to render doctype`);
    assert.ok(html.includes('Md. Nafizur Rahman'), `Template ${tpl.id} missing user name`);
    assert.ok(html.includes('timeline-list'), `Template ${tpl.id} missing education timeline`);
  }
});

test('renderPortfolioHtml prevents XSS injection', () => {
  const maliciousProfile = {
    ...fallbackData,
    identity: {
      ...fallbackData.identity,
      fullName: '<script>alert("xss")</script>Nafiz',
      quote: '"><img src=x onerror=alert(1)>'
    }
  };
  const html = renderPortfolioHtml(maliciousProfile, { templateId: 'acad-flagship' });
  assert.ok(!html.includes('<script>alert("xss")</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));
});

test('generateSeoTags produces valid OpenGraph, Twitter, and JSON-LD Person data', () => {
  const seo = generateSeoTags(fallbackData);
  assert.ok(seo.headMarkup.includes('og:title'));
  assert.ok(seo.headMarkup.includes('application/ld+json'));
  assert.equal(seo.jsonLd['@type'], 'Person');
  assert.equal(seo.jsonLd.name, 'Md. Nafizur Rahman');
});
