// src/main/java/com/adi/docflow/repository/RequestRepository.java 
package com.adi.docflow.repository; 
import com.adi.docflow.model.Request; 
import com.adi.docflow.model.RequestStatus; 
import com.adi.docflow.web.dto.RequestSummaryDTO; 
import org.springframework.data.domain.Page; 
import org.springframework.data.domain.Pageable; 
import org.springframework.data.jpa.repository.*; 
import org.springframework.data.repository.query.Param; 
import java.util.List; 
import java.util.Optional; 
public interface RequestRepository extends JpaRepository<Request, Long>, JpaSpecificationExecutor<Request> { 
/* ---------- Listagens rápidas ---------- */ 
List<Request> 
findTop50ByStatusOrderByCreatedAtDesc(RequestStatus status); 
/* ---------- Protocolo da Request ---------- */ 
// usado para garantir unicidade ao gerar protocolo 
//boolean existsByProtocol(String protocol); 
// lookup por protocolo (útil para consultas diretas) 
Optional<Request> findByProtocol(String protocol); 
/* ---------- Summaries paginados com busca/filtro ---------- */ 
@Query(""" 
select new com.adi.docflow.web.dto.RequestSummaryDTO( 
r.id, 
r.requestNumber, 
p.id, 
p.name, 
o.id, coalesce(o.name, 'Interno'), 
d.id, coalesce(d.name, 'Interno'), 
r.purpose, 
(select count(distinct rd.id) from RequestDocument rd where rd.request.id = r.id), 
r.requestDate, 
r.status 
) 
from Request r 
left join r.project p 
left join r.origin o 
left join r.destination d 
where (:status is null or r.status = :status) 
and ( 
:q is null 
or lower(r.requestNumber) like lower(concat('%', :q, '%')) 
or lower(r.purpose) like lower(concat('%', :q, '%')) 
or lower(coalesce(p.name,'')) like lower(concat('%', :q, '%')) 
or lower(coalesce(o.name,'')) like lower(concat('%', :q, '%')) 
or lower(coalesce(d.name,'')) like lower(concat('%', :q, '%')) 
) 
""") 
Page<RequestSummaryDTO> findSummaries(@Param("q") String q, 
@Param("status") RequestStatus status, 
Pageable pageable); 
}