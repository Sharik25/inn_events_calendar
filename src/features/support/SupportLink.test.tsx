import { render, screen } from '@testing-library/react';
import { SUPPORT_URL } from '@/config';
import { SupportLink } from './SupportLink';

describe('SupportLink', () => {
  it('opens the configured page in a new tab without a referrer', () => {
    render(<SupportLink url="https://ko-fi.com/innkeeper" />);
    const link = screen.getByRole('link', { name: /Buy me a beer 🍺/ });
    expect(link).toHaveAttribute('href', 'https://ko-fi.com/innkeeper');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // jsdom drops the space browsers keep before the screen-reader suffix.
    expect(link).toHaveAccessibleName(/^Buy me a beer 🍺\s*\(opens in a new tab\)$/);
  });

  it('stays hidden until an https URL is configured', () => {
    const { container } = render(
      <>
        <SupportLink url="" />
        <SupportLink url="http://insecure.example" />
        <SupportLink url="javascript:alert(1)" />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('uses SUPPORT_URL from src/config.ts by default', () => {
    const { container } = render(<SupportLink />);
    if (SUPPORT_URL) expect(screen.getByRole('link')).toHaveAttribute('href', SUPPORT_URL);
    else expect(container).toBeEmptyDOMElement();
  });
});
