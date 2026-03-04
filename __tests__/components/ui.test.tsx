import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render different variants', () => {
    const { container: primary } = render(<Button variant="primary">Primary</Button>);
    const { container: secondary } = render(<Button variant="secondary">Secondary</Button>);
    const { container: outline } = render(<Button variant="outline">Outline</Button>);

    expect(primary.querySelector('button')).toBeInTheDocument();
    expect(secondary.querySelector('button')).toBeInTheDocument();
    expect(outline.querySelector('button')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { container: sm } = render(<Button size="sm">Small</Button>);
    const { container: md } = render(<Button size="md">Medium</Button>);
    const { container: lg } = render(<Button size="lg">Large</Button>);

    expect(sm.querySelector('button')).toBeInTheDocument();
    expect(md.querySelector('button')).toBeInTheDocument();
    expect(lg.querySelector('button')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('should be disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByRole('button').click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with full width', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);
    expect(container.querySelector('button')).toHaveClass('w-full');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    expect(container.querySelector('button')).toHaveClass('custom-class');
  });

  it('should handle type prop', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});

describe('Badge Component', () => {
  it('should render with children', () => {
    render(<Badge>Badge Text</Badge>);
    expect(screen.getByText('Badge Text')).toBeInTheDocument();
  });

  it('should render different variants', () => {
    const { container: defaultBadge } = render(<Badge>Default</Badge>);
    const { container: categoryBadge } = render(<Badge variant="category" href="/category/test">Category</Badge>);
    const { container: tagBadge } = render(<Badge variant="tag">Tag</Badge>);

    expect(defaultBadge.querySelector('span')).toBeInTheDocument();
    expect(categoryBadge.querySelector('a')).toBeInTheDocument();
    expect(tagBadge.querySelector('span')).toBeInTheDocument();
  });

  it('should render with href as link', () => {
    render(<Badge href="/category/test">Link Badge</Badge>);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/category/test');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<Badge>Accessible Badge</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('EmptyState Component', () => {
  it('should render with title and description', () => {
    render(<EmptyState title="No Results" description="There are no items to display" />);
    
    expect(screen.getByText('No Results')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<EmptyState title="Empty" icon={<span>Icon</span>} />);
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('should render action link when provided', () => {
    render(
      <EmptyState 
        title="No Results" 
        action={{ label: 'Try Again', href: '/' }}
      />
    );
    
    expect(screen.getByRole('link', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<EmptyState title="Empty State" description="Nothing here" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
