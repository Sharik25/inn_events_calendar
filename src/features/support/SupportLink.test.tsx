import { render, screen } from '@testing-library/react';
import { SupportLink } from './SupportLink';

describe('SupportLink', () => {
  it('opens the configured page in a new tab without a referrer', () => {
    render(<SupportLink url="https://ko-fi.com/innkeeper" preview={false} />);
    const link = screen.getByRole('link', { name: /Buy me a beer 🍺/ });
    expect(link).toHaveAttribute('href', 'https://ko-fi.com/innkeeper');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // jsdom drops the space browsers keep before the screen-reader suffix.
    expect(link).toHaveAccessibleName(/^Buy me a beer 🍺\s*\(opens in a new tab\)$/);
  });

  it('renders nothing on the live site until an https URL is configured', () => {
    const { container } = render(
      <>
        <SupportLink url="" preview={false} />
        <SupportLink url="http://insecure.example" preview={false} />
        <SupportLink url="javascript:alert(1)" preview={false} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an inert placeholder in development so the layout can be checked', () => {
    render(<SupportLink url="" preview />);
    const link = screen.getByRole('link', { name: 'Buy me a beer 🍺' });
    expect(link).toHaveAttribute('data-placeholder');
    expect(link).not.toHaveAttribute('target');
    expect(link).toHaveAttribute('title', 'Placeholder: set SUPPORT_URL in src/config.ts');
  });
});
