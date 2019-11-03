import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

import api from '../../services/api';
import { Container } from '../../components/Container';
import {
  Loading,
  Owner,
  Filter,
  FilterButton,
  IssueList,
  Pagination,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    state: 'open',
    pages: {},
  };

  async componentDidMount() {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const { state } = this.state;

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state,
          per_page: 5,
        },
      }),
    ]);

    this.updatePages(issues.headers.link);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async componentDidUpdate(_, prevState) {
    const { state } = this.state;
    if (prevState.state !== state) {
      await this.updateIssues();
    }
  }

  async updateIssues(url) {
    const { repository, state } = this.state;

    const issues = await api.get(
      url || `/repos/${repository.full_name}/issues`,
      {
        params: {
          per_page: 5,
          state,
        },
      }
    );

    this.updatePages(issues.headers.link);
    this.setState({
      issues: issues.data,
    });
  }

  updatePages(pagesString) {
    const pages = {};

    pagesString.split(',').forEach(page => {
      const regexp = /<(.*)>; rel="(.*)"/g;
      const matches = page.matchAll(regexp);
      // eslint-disable-next-line no-restricted-syntax
      for (const match of matches) {
        Object.assign(pages, { [match[2]]: match[1] });
        break;
      }
    });

    this.setState({
      pages,
    });
  }

  handleStateChange(state) {
    this.setState({ state });
  }

  async handlePagination(url) {
    await this.updateIssues(url);
  }

  render() {
    const { repository, issues, loading, state, pages } = this.state;

    if (loading) {
      return <Loading>Loading...</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Back to repositories</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <Filter>
          <FilterButton
            hilight={state === 'open'}
            onClick={() => this.handleStateChange('open')}
          >
            Open
          </FilterButton>
          <FilterButton
            hilight={state === 'closed'}
            onClick={() => this.handleStateChange('closed')}
          >
            Closed
          </FilterButton>
          <FilterButton
            hilight={state === 'all'}
            onClick={() => this.handleStateChange('all')}
          >
            All
          </FilterButton>
        </Filter>
        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pagination>
          <button
            type="button"
            disabled={!pages.prev}
            onClick={() => this.handlePagination(pages.prev)}
          >
            <FaAngleDoubleLeft />
          </button>
          <button
            type="button"
            disabled={!pages.next}
            onClick={() => this.handlePagination(pages.next)}
          >
            <FaAngleDoubleRight />
          </button>
        </Pagination>
      </Container>
    );
  }
}
