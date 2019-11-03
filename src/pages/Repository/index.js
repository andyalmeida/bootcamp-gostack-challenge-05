import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import api from '../../services/api';
import { Container } from '../../components/Container';
import { Loading, Owner, Filter, FilterButton, IssueList } from './styles';

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

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async componentDidUpdate(_, prevState) {
    const { repository, state } = this.state;
    if (prevState.state !== state) {
      const issues = await api.get(`/repos/${repository.full_name}/issues`, {
        params: {
          state,
          per_page: 5,
        },
      });

      this.updateIssues(issues.data);
    }
  }

  updateIssues(issues) {
    this.setState({
      issues,
    });
  }

  handleStateChange(state) {
    this.setState({ state });
  }

  render() {
    const { repository, issues, loading, state } = this.state;

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
      </Container>
    );
  }
}
