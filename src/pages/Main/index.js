import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FaGithubAlt, FaPlus, FaSpinner } from 'react-icons/fa';

import api from '../../services/api';
import { Container } from '../../components/Container';
import { Form, SubmitButton, ErrorMessage, List } from './styles';

export default class Main extends Component {
  state = {
    newRepo: '',
    repositories: [],
    loading: false,
    error: false,
    errorMessage: '',
  };

  componentDidMount() {
    const repositories = localStorage.getItem('repositories');

    if (repositories) {
      this.setState({ repositories: JSON.parse(repositories) });
    }
  }

  componentDidUpdate(_, prevState) {
    const { repositories } = this.state;

    if (prevState.repositories !== repositories) {
      localStorage.setItem('repositories', JSON.stringify(repositories));
    }
  }

  handleInputChange = e => {
    this.setState({ newRepo: e.target.value });
  };

  handleSubmit = async e => {
    try {
      e.preventDefault();
      const { newRepo, repositories } = this.state;

      if (!newRepo) throw new Error('You need enter a repository name.');

      const repoExist = repositories.find(repo => repo.name === newRepo);
      if (repoExist) throw new Error('Repository already added.');

      this.setState({ loading: true });

      const response = await api.get(`/repos/${newRepo}`).catch(error => {
        if (error.response.status === 404)
          throw new Error('Repository not found.');
      });

      const data = {
        name: response.data.full_name,
      };

      this.setState({
        repositories: [...repositories, data],
        newRepo: '',
        loading: false,
        error: false,
        errorMessage: '',
      });
    } catch (error) {
      this.setState({
        error: true,
        errorMessage: error.message,
        loading: false,
      });
    }
  };

  render() {
    const { newRepo, repositories, loading, error, errorMessage } = this.state;

    return (
      <Container>
        <h1>
          <FaGithubAlt /> Repositories
        </h1>
        <Form onSubmit={this.handleSubmit} error={error}>
          <input
            type="text"
            placeholder="Add repository"
            value={newRepo}
            onChange={this.handleInputChange}
          />
          <SubmitButton loading={loading}>
            {loading ? (
              <FaSpinner color="#FFF" size={14} />
            ) : (
              <FaPlus color="#FFF" size={14} />
            )}
          </SubmitButton>
        </Form>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

        <List>
          {repositories.map(respository => (
            <li key={respository.name}>
              {respository.name}{' '}
              <Link to={`/repository/${encodeURIComponent(respository.name)}`}>
                DETAILS
              </Link>
            </li>
          ))}
        </List>
      </Container>
    );
  }
}
