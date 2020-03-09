import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import Container from '../../components/Container';
import { Loading, Owner, IssueList, IssueFilter } from './styles';

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
    filters: [
      { state: 'all', lastClicked: true },
      { state: 'open', lastClicked: false },
      { state: 'closed', lastClicked: false },
    ],
    index: 0,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filters } = this.state;

    const repoName = decodeURIComponent(match.params.repository);
    // Precisamos acessar aos endereços da api

    // api.github.com/repos/rocketseat/unform
    // api.github.com/repos/rocketseat/unform/issues

    // Que poderia ser feito desta maneira, mas..
    // const response = await api.get(`/repos/${repoName}`);
    // const issues = await api.get(`/repos/${repoName}/issues`);

    /* ... as chamadas poderiam ser feitas assim, como acima,
        mas não tem necessidade de fazer uma chamada por vez.
        Neste caso podem ser executadas concomitantemente,
        sem precedência.
        Então vamos executar as 2 sem ordem de precedência,
        e atribuir o resultado de suas execuções às devidas variáveis.
    */
    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters.find(f => f.lastClicked).state,
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

  handleIssueFilterClick = async index => {
    await this.setState({ index });
    this.loadIssues();
  };

  loadIssues = async () => {
    const { match } = this.props;
    const { filters, index } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const filteredIssues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[index].state,
        per_page: 5,
      },
    });

    this.setState({
      issues: filteredIssues.data,
    });
  };

  render() {
    const { repository, issues, loading, filters, index } = this.state;

    if (loading) {
      return <Loading>Carregando...</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          {/* preciso passar como parâmetro qual botão foi clicado por último */}
          <IssueFilter lastClicked={index}>
            {filters.map((filtro, indice) => (
              <button
                type="button"
                key={filtro.state}
                onClick={() => this.handleIssueFilterClick(indice)}
              >
                {filtro.state}
              </button>
            ))}
          </IssueFilter>
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
